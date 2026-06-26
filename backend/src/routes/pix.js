import { Router } from 'express';
import { randomUUID } from 'crypto';
import { queryOne, run, withTransaction } from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import EfiPay from 'sdk-node-apis-efi';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Configuração EfiPay
function getEfiOptions() {
  return {
    sandbox: process.env.EFI_SANDBOX === 'true',
    client_id: process.env.EFI_CLIENT_ID,
    client_secret: process.env.EFI_CLIENT_SECRET,
    pix_cert: path.resolve(process.env.EFI_CERT_PATH || path.join(__dirname, '../../certs/producao.p12')),
  };
}

const PIX_KEY = process.env.EFI_PIX_KEY; // Sua chave PIX cadastrada na EfiPay

// ============ ROTAS AUTENTICADAS (cliente) ============

// Criar cobrança PIX
router.post('/charge', authRequired, requireRole('client'), async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Valor mínimo de R$ 1,00' });
    }

    const txid = randomUUID().replace(/-/g, '').slice(0, 26);
    const efi = new EfiPay(getEfiOptions());

    // 1) Criar cobrança imediata
    const charge = await efi.pixCreateImmediateCharge({ txid }, {
      calendario: { expiracao: 3600 }, // 1 hora para pagar
      valor: { original: Number(amount).toFixed(2) },
      chave: PIX_KEY,
      solicitacaoPagador: `Depósito HudBroker - ${req.auth.email || req.auth.id}`,
      infoAdicionais: [
        { nome: 'userId', valor: req.auth.id }
      ]
    });

    // 2) Gerar QR Code
    const qrcode = await efi.pixGenerateQRCode({ id: charge.loc.id });

    // 3) Salvar no banco para rastrear
    await run(
      `INSERT INTO pix_charges (id, txid, user_id, amount, status, loc_id, created_at)
       VALUES ($1, $2, $3, $4, 'pending', $5, now())`,
      [randomUUID(), txid, req.auth.id, amount, charge.loc.id]
    );

    res.json({
      txid,
      qrcode: qrcode.imagemQrcode,   // base64 da imagem
      copiaecola: qrcode.qrcode,      // texto para copiar
      expiracao: 3600
    });
  } catch (err) {
    console.error('[pix/charge]', err);
    res.status(500).json({ error: 'Erro ao gerar cobrança PIX' });
  }
});

// Consultar status de uma cobrança
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

// ============ WEBHOOK (chamado pela EfiPay) ============

router.post('/webhook', async (req, res) => {
  try {
    // EfiPay envia { pix: [{ txid, valor, horario, ... }] }
    const pixArray = req.body.pix;
    if (!pixArray || !Array.isArray(pixArray)) {
      return res.status(200).json({ ok: true }); // responder 200 pra EfiPay não retentar
    }

    for (const pix of pixArray) {
      const { txid } = pix;
      if (!txid) continue;

      const charge = await queryOne(
        "SELECT * FROM pix_charges WHERE txid = $1 AND status = 'pending'",
        [txid]
      );
      if (!charge) continue; // já processado ou não existe

      // Creditar saldo do usuário
      await withTransaction(async (client) => {
        await client.query(
          "UPDATE pix_charges SET status = 'paid', paid_at = now() WHERE id = $1",
          [charge.id]
        );
        await client.query(
          'UPDATE users SET balance = balance + $1 WHERE id = $2',
          [charge.amount, charge.user_id]
        );
        await client.query(
          `INSERT INTO transactions (id, user_id, type, amount, reference_id, status)
           VALUES ($1, $2, 'deposit', $3, $4, 'completed')`,
          [randomUUID(), charge.user_id, charge.amount, charge.txid]
        );
      });

      console.log(`[pix/webhook] Depósito confirmado: R$ ${charge.amount} para user ${charge.user_id}`);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[pix/webhook]', err);
    res.status(200).json({ ok: true }); // sempre 200 pro webhook não ficar retentando
  }
});

// Endpoint de confirmação do webhook (EfiPay faz um PUT pra validar)
router.put('/webhook', (req, res) => {
  res.status(200).end();
});

export default router;
