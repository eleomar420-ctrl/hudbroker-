import { Router } from 'express';
import { randomUUID } from 'crypto';
import { queryOne, run } from '../db/index.js';
import { authRequired } from '../middleware/auth.js';
import { priceFeed } from '../services/priceFeed.js';
import { openTrade, getOpenTrades, getTradeHistory } from '../services/tradeEngine.js';
import { processFirstDeposit } from '../services/commissionEngine.js';

const router = Router();

router.get('/prices', (req, res) => {
  res.json(priceFeed.getAllPrices());
});

router.get('/prices/:asset', (req, res) => {
  const price = priceFeed.getPrice(req.params.asset);
  if (price === null) return res.status(404).json({ error: 'Ativo não encontrado' });
  res.json({ asset: req.params.asset.toUpperCase(), price });
});

router.post('/trades', authRequired, async (req, res) => {
  try {
    const { asset, direction, stake, durationSeconds, payoutPct } = req.body;
    const result = await openTrade({
      userId: req.auth.id,
      asset: asset.toUpperCase(),
      direction,
      stake: Number(stake),
      durationSeconds: Number(durationSeconds),
      payoutPct: payoutPct ?? 0.85
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/trades/open', authRequired, async (req, res) => {
  res.json(await getOpenTrades(req.auth.id));
});

router.get('/trades/history', authRequired, async (req, res) => {
  res.json(await getTradeHistory(req.auth.id));
});

router.get('/me', authRequired, async (req, res) => {
  const user = await queryOne('SELECT id, name, email, balance, kyc_status FROM users WHERE id = $1', [req.auth.id]);
  res.json(user);
});

router.post('/deposit', authRequired, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });

    await run('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, req.auth.id]);
    await run(
      `INSERT INTO transactions (id, user_id, type, amount, status) VALUES ($1, $2, 'deposit', $3, 'completed')`,
      [randomUUID(), req.auth.id, amount]
    );

    await processFirstDeposit({ userId: req.auth.id, depositAmount: amount });

    const user = await queryOne('SELECT balance FROM users WHERE id = $1', [req.auth.id]);
    res.json({ balance: user.balance });
  } catch (err) {
    console.error('[trading/deposit]', err);
    res.status(500).json({ error: 'Erro interno ao processar depósito' });
  }
});

export default router;
