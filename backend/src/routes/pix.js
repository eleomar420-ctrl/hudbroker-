import { Router } from 'express';
import { randomUUID } from 'crypto';
import { queryOne, query, run, withTransaction } from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();

const ZYRO_API = 'https://gateway-zyropay-api.rancher.codefabrik.dev';
let zyroToken = null;
let zyroTokenExp = 0;

// Autenticar na ZyroPay e obter token JWT
async function getZyroToken() {
  if (zyroToken && Date.now() < zyroTokenExp) return zyroToken;
  
  const res = await fetch(`${ZYRO_API}/cli/client/authenticate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.PIX_CLIENT_ID,
      password: process.env.PIX_SECRET
    })
  });
  const data = await res.json();
  if (!data.success || !data.data || !data.data.token) {
    console.error('[zyro] Auth failed:', JSON.stringify(data));
    throw new Error('Erro ao autenticar na ZyroPay');
  }
  zyroToken = data.data.token;
  zyroTokenExp = Date.now() + (7 * 60 * 60 * 1000); // 7h
  console.log('[zyro] Token obtido com sucesso');
  return zyroToken;
}

// ============ LISTAR COBRANÇAS DO USUÁRIO ============

router.get('/charges', authRequired, requireRole('client'), async (req, res) => {
  try {
    const charges = await query(
      'SELECT * FROM pix_charges WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.auth.id]
    );
    res.json(charges);
  } catch (err) {
    console.error('[pix/charges]', err);
    res.status(500).json({ error: 'Erro ao listar cobranças' });
  }
});

// ============ CRIAR COBRANÇA PIX ============

router.post('/charge', authRequired, requireRole('client'), async (req, res) => {
  try {
    var { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Valor mínimo de R$ 1,00' });
    }

    var externalId = 'hud-' + randomUUID().replace(/-/g, '').slice(0, 20);
    var token = await getZyroToken();

    console.log('[pix/charge] Gerando PIX:', { amount, externalId });

    var response = await fetch(`${ZYRO_API}/cli/payment/pix/generate-pix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        value: Number(amount),
        expiration: 3600,
        externalId: externalId
      })
    });

    var data = await response.json();
    console.log('[pix/charge] ZyroPay response:', JSON.stringify(data));

    if (!data.success || !data.data) {
      console.error('[pix/charge] ZyroPay error:', JSON.stringify(data));
      // Token expirado? Tentar renovar
      if (response.status === 401) {
        zyroToken = null;
        zyroTokenExp = 0;
      }
      return res.status(400).json({ error: data.errors || 'Erro ao gerar cobrança PIX' });
    }

    var pixCode = data.data.pix || '';
    var paymentId = data.data.paymentId || '';
    var movId = data.data.movId || '';

    // Salvar no banco
    await run(
      `INSERT INTO pix_charges (id, txid, user_id, amount, status, loc_id, created_at)
       VALUES ($1, $2, $3, $4, 'pending', 0, now())`,
      [randomUUID(), externalId, req.auth.id, amount]
    );

    // QR Code gerado a partir do pixCode
    var qrcodeUrl = pixCode
      ? 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=' + encodeURIComponent(pixCode)
      : null;

    res.json({
      txid: externalId,
      qrcode: qrcodeUrl,
      copiaecola: pixCode,
      paymentId: paymentId,
      movId: movId,
      expiracao: 3600
    });
  } catch (err) {
    console.error('[pix/charge]', err);
    res.status(500).json({ error: 'Erro ao gerar cobrança PIX' });
  }
});

// ============ CONSULTAR STATUS ============

router.get('/charge/:txid', authRequired, requireRole('client'), async (req, res) => {
  try {
    var charge = await queryOne(
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

// ============ WEBHOOK ZyroPay ============

router.post('/webhook', async (req, res) => {
  try {
    console.log('[pix/webhook] Body recebido:', JSON.stringify(req.body));

    var type = req.body.type;
    var status = req.body.status;
    var externalId = req.body.externalId;
    var value = req.body.value;
    var movId = req.body.movId;
    var paymentId = req.body.paymentId;

    console.log('[pix/webhook] Type:', type, 'Status:', status, 'ExternalId:', externalId, 'Value:', value);

    // PIX IN confirmado
    if (type === 'PixIn' && status === 'CONFIRMED' && externalId) {
      var charge = await queryOne(
        "SELECT * FROM pix_charges WHERE txid = $1 AND status = 'pending'",
        [externalId]
      );

      if (!charge) {
        console.warn('[pix/webhook] Cobrança não encontrada ou já paga:', externalId);
        return res.status(200).json({ ok: true });
      }

      var amountReal = Number(value) || charge.amount;

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

      console.log('[pix/webhook] ✅ Depósito confirmado: R$', amountReal, 'para user', charge.user_id);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[pix/webhook] Erro:', err);
    res.status(200).json({ ok: true });
  }
});

export default router;
