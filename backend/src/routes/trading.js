import { Router } from 'express';
import { randomUUID } from 'crypto';
import { query, queryOne, run, withTransaction } from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { openTrade, getOpenTrades, getTradeHistory } from '../services/tradeEngine.js';
import { processFirstDeposit } from '../services/commissionEngine.js';

const router = Router();
router.use(authRequired, requireRole('client'));

// Dados do usuário logado
router.get('/me', async (req, res) => {
  const user = await queryOne(
    `SELECT id, name, last_name, email, phone, country, currency, balance, demo_balance, avatar_url, kyc_status, status, created_at
     FROM users WHERE id = $1`,
    [req.auth.id]
  );
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  res.json(user);
});

// Depósito (simulado — apenas credita saldo virtual)
router.post('/deposit', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });

    await withTransaction(async (client) => {
      await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, req.auth.id]);
      await client.query(
        `INSERT INTO transactions (id, user_id, type, amount, reference_id)
         VALUES ($1, $2, 'deposit', $3, $4)`,
        [randomUUID(), req.auth.id, amount, null]
      );
    });

    // CPA: processa comissão no primeiro depósito
    await processFirstDeposit({ userId: req.auth.id });

    const user = await queryOne('SELECT balance, demo_balance FROM users WHERE id = $1', [req.auth.id]);
    res.json({ ok: true, balance: user.balance, demoBalance: user.demo_balance });
  } catch (err) {
    console.error('[trading/deposit]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Abrir operação
router.post('/trades', async (req, res) => {
  try {
    const { accountType, asset, direction, stake, durationSeconds, payoutPct } = req.body;
    const result = await openTrade({
      userId: req.auth.id,
      accountType: accountType || 'demo',
      asset,
      direction,
      stake: Number(stake),
      durationSeconds: Number(durationSeconds),
      payoutPct: payoutPct != null ? Number(payoutPct) : 0.85
    });
    res.json(result);
  } catch (err) {
    console.error('[trading/open]', err);
    res.status(400).json({ error: err.message });
  }
});

// Operações abertas
router.get('/trades/open', async (req, res) => {
  const accountType = req.query.accountType;
  const trades = await getOpenTrades(req.auth.id, accountType);
  res.json(trades);
});

// Histórico
router.get('/trades/history', async (req, res) => {
  const accountType = req.query.account;
  const trades = await getTradeHistory(req.auth.id, accountType);
  res.json(trades);
});

// Atualizar avatar
router.post('/avatar', async (req, res) => {
  try {
    const { avatarDataUrl } = req.body;
    if (!avatarDataUrl) return res.status(400).json({ error: 'Imagem não enviada' });

    // Limite de segurança (~700KB em base64)
    if (avatarDataUrl.length > 700 * 1024) {
      return res.status(400).json({ error: 'Imagem muito grande' });
    }

    await run('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarDataUrl, req.auth.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[trading/avatar]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
