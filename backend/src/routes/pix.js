import { Router } from 'express';
import { randomUUID } from 'crypto';
import crypto from 'crypto';
import { queryOne, run, withTransaction } from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { processFirstDeposit } from '../services/commissionEngine.js';

const router = Router();

const IHUB_API = 'https://api.ihubplay.com';

function getAuthHeader() {
  const secretKey = process.env.IHUB_SECRET_KEY;
  const encoded = Buffer.from('secret:' + secretKey).toString('base64');
  return 'Basic ' + encoded;
}

// ============ CRIAR COBRANÇA PIX ============

router.post('/charge', authRequired, requireRole('client'), async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Valor mínimo de R$ 1,00' });
    }

    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.auth.id]);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const externalId = 'hud-' + randomUUID().replace(/-/g, '').slice(0, 20);
    const amountCents = Math.round(amount * 100);
    const webhookUrl = process.env.IHUB_WEBHOOK_URL || `https://${req.get('host')}/api/pix/webhook`;

    const authHeader = getAuthHeader();
    console.log('[pix/charge] Auth header prefix:', authHeader.substring(0, 20) + '...');
    console.log('[pix/charge] Enviando para iHub:', JSON.stringify({ amount: amountCents, paymentMethod: 'PIX', externalId }));

    const response = await fetch(`${IHUB_API}/transactions/v2/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        name: user.name || 'Cliente',
        email: user.email,
        cpf: user.phone ? user.phone.replace(/\D/g, '').slice(0, 11) : '00000000000',
        phone: user.phone ? user.phone.replace(/\D/g, '').slice(-11) : '0000000000',
        amount: amountCents,
        description: `Depósito HudBroker - ${user.email}`,
        responsibleDocument: user.phone ? user.phone.replace(/\D/g, '').slice(0, 11) : '00000000000',
        responsibleExternalId: req.auth.id.slice(0, 10),
        paymentMethod: 'PIX',
        currency: 'BRL',
        externalId: externalId,
        postbackUrl: webhookUrl
      })
    });

    const data = await response.json();
    console.log('[pix/charge] iHub response FULL:', JSON.stringify(data));

    if (!response.ok) {
      console.error('[pix/charge] iHub status:', response.status);
      console.error('[pix/charge] iHub response:', JSON.stringify(data));
      console.error('[pix/charge] iHub headers:', JSON.stringify(Object.fromEntries(response.headers)));
      return res.status(400).json({ error: data.message || 'Erro ao gerar cobrança PIX' });
    }

    // Salvar no banco
    const txid = externalId;
    await run(
      `INSERT INTO pix_charges (id, txid, user_id, amount, status, loc_id, created_at)
       VALUES ($1, $2, $3, $4, 'pending', 0, now())`,
      [randomUUID(), externalId, req.auth.id, amount]
    );

    // iHub retorna pixCode (copia e cola) — gerar QR via API
    const pixCode = data.pixCode || '';
    const qrcodeUrl = pixCode 
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixCode)}`
      : null;

    res.json({
      txid: externalId,
      qrcode: qrcodeUrl,
      copiaecola: pixCode,
      expiracao: Math.max(60, Math.floor((new Date(data.expiresAt) - Date.now()) / 1000))
    });
  } catch (err) {
    console.error('[pix/charge]', err);
    res.status(500).json({ error: 'Erro ao gerar cobrança PIX' });
  }
});

// ============ CONSULTAR STATUS ============

router.get('/charge/:txid', authRequired, requireRole('client'), async (req, res) => {
  try {
    const charge = await queryOne(
      'SELECT * FROM pix_charges WHERE txid = $1 AND user_id = $2',
      [req.params.txid, req.auth.id]
    );
    if (!charge) return res.status(404).json({ error: 'Cobrança não encontrada' });
    res.json(charge);
  } catch (err) {
    console.error('[pix/status]', err);
    res.status(500).json({ error: 'Erro ao consultar cobrança' });
  }
});

// ============ WEBHOOK iHub V2 ============

router.post('/webhook', async (req, res) => {
  try {
    const event = req.body.event;
    const payload = req.body.payload;

    console.log(`[pix/webhook] Evento recebido: ${event}`, JSON.stringify(payload));

    // Verificar assinatura (se configurada)
    const signature = req.headers['x-signature'] || req.headers['x-webhook-signature'];
    const webhookKey = process.env.IHUB_WEBHOOK_KEY;
    if (webhookKey && signature) {
      const expectedSig = crypto
        .createHmac('sha256', webhookKey)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (signature !== expectedSig) {
        console.warn('[pix/webhook] Assinatura inválida');
        return res.status(200).json({ ok: true });
      }
    }

    // Processar evento cashin.paid (depósito confirmado)
    if (event === 'cashin.paid' && payload) {
      const externalId = payload.external_id;
      const amountCents = payload.amount;

      if (!externalId) {
        console.warn('[pix/webhook] external_id ausente');
        return res.status(200).json({ ok: true });
      }

      const charge = await queryOne(
        "SELECT * FROM pix_charges WHERE txid = $1 AND status = 'pending'",
        [externalId]
      );

      if (!charge) {
        console.warn(`[pix/webhook] Cobrança não encontrada ou já paga: ${externalId}`);
        return res.status(200).json({ ok: true });
      }

      const amountReal = amountCents / 100;

      // Creditar saldo do usuário
      await withTransaction(async (client) => {
        await client.query(
          "UPDATE pix_charges SET status = 'paid', paid_at = now() WHERE id = $1",
          [charge.id]
        );
        await client.query(
          'UPDATE users SET balance = balance + $1 WHERE id = $2',
          [amountReal, charge.user_id]
        );
        await client.query(
          `INSERT INTO transactions (id, user_id, type, amount, reference_id, status)
           VALUES ($1, $2, 'deposit', $3, $4, 'completed')`,
          [randomUUID(), charge.user_id, amountReal, externalId]
        );
      });

      // Comissão CPA no primeiro depósito
      await processFirstDeposit({ userId: charge.user_id });

      console.log(`[pix/webhook] ✅ Depósito confirmado: R$ ${amountReal} para user ${charge.user_id}`);
    }

    // cashin.refunded
    if (event === 'cashin.refunded' && payload) {
      const externalId = payload.external_id;
      console.log(`[pix/webhook] Reembolso: ${externalId}`);
      if (externalId) {
        await run("UPDATE pix_charges SET status = 'refunded' WHERE txid = $1", [externalId]);
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[pix/webhook]', err);
    res.status(200).json({ ok: true });
  }
});

export default router;
