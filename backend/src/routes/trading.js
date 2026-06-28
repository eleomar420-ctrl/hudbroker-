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

// Listar depósitos do usuário
router.get('/deposits', async (req, res) => {
  try {
    const deposits = await query(
      `SELECT pc.*, ROW_NUMBER() OVER (ORDER BY pc.created_at) as deposit_number 
       FROM pix_charges pc WHERE pc.user_id = $1 ORDER BY pc.created_at DESC`,
      [req.auth.id]
    );
    res.json(deposits);
  } catch (err) {
    console.error('[trading/deposits]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Listar saques do usuário
// withdrawals antigo removido - usando nova rota abaixo

// Solicitar saque
router.post('/withdrawals', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });
    const user = await queryOne('SELECT balance FROM users WHERE id = $1', [req.auth.id]);
    if (amount > user.balance) return res.status(400).json({ error: 'Saldo insuficiente' });
    
    await withTransaction(async (client) => {
      await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, req.auth.id]);
      await client.query(
        `INSERT INTO withdrawal_requests (id, requester_type, requester_id, amount) VALUES ($1, 'user', $2, $3)`,
        [randomUUID(), req.auth.id, amount]
      );
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[trading/withdrawals]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// cancel antigo removido - usando nova rota abaixo

// Atualizar dados do usuário (apenas uma vez)
router.patch('/me', async (req, res) => {
  try {
    const { document: doc, birthdate, phone } = req.body;
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.auth.id]);
    if (user.data_updated) return res.status(400).json({ error: 'Dados já foram atualizados' });
    await run(
      `UPDATE users SET phone = COALESCE($1, phone), document = $2, birthdate = $3, data_updated = true WHERE id = $4`,
      [phone || user.phone, doc, birthdate, req.auth.id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('[trading/me]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// === SAQUES DO CLIENTE ===
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, pixKey } = req.body;
    const userId = req.auth.id;
    const minWithdraw = 150;
    const taxRate = 0.10;

    if (!amount || !pixKey) return res.status(400).json({ error: 'Valor e chave PIX obrigatórios' });
    if (amount < minWithdraw) return res.status(400).json({ error: `Valor mínimo de saque: R$ ${minWithdraw},00` });

    const user = await queryOne('SELECT balance FROM users WHERE id = $1', [userId]);
    if (!user || user.balance < amount) return res.status(400).json({ error: 'Saldo insuficiente' });

    const tax = Math.round(amount * taxRate * 100) / 100;
    const netAmount = Math.round((amount - tax) * 100) / 100;
    const id = randomUUID();

    await run('UPDATE users SET balance = balance - $1 WHERE id = $2', [amount, userId]);
    await run(
      `INSERT INTO withdrawals (id, user_id, amount, net_amount, tax, pix_key, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', now())`,
      [id, userId, amount, netAmount, tax, pixKey]
    );

    res.json({ ok: true, id, amount, netAmount, tax });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/withdrawals', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.auth.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancelar saque (lead cancela)
router.patch('/withdrawals/:id/cancel', async (req, res) => {
  try {
    const w = await queryOne(
      "SELECT * FROM withdrawals WHERE id = $1 AND user_id = $2 AND status = 'pending'",
      [req.params.id, req.auth.id]
    );
    if (!w) return res.status(400).json({ error: 'Saque não encontrado ou já processado' });
    await run("UPDATE withdrawals SET status = 'cancelled', updated_at = now() WHERE id = $1", [w.id]);
    await run('UPDATE users SET balance = balance + $1 WHERE id = $2', [w.amount, req.auth.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
