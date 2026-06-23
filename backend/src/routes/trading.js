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
    const { asset, direction, stake, durationSeconds, payoutPct, accountType } = req.body;
    const result = await openTrade({
      userId: req.auth.id,
      accountType: accountType === 'real' ? 'real' : 'demo',
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
  res.json(await getOpenTrades(req.auth.id, req.query.accountType));
});

router.get('/trades/history', authRequired, async (req, res) => {
  res.json(await getTradeHistory(req.auth.id, req.query.accountType));
});

router.get('/me', authRequired, async (req, res) => {
  const user = await queryOne(
    'SELECT id, name, last_name, email, balance, demo_balance, currency, avatar_url, kyc_status FROM users WHERE id = $1',
    [req.auth.id]
  );
  res.json(user);
});

// Salva a foto de perfil do usuário (base64), validando tamanho para não sobrecarregar o banco.
router.post('/avatar', authRequired, async (req, res) => {
  try {
    const { avatarDataUrl } = req.body;
    if (!avatarDataUrl || typeof avatarDataUrl !== 'string') {
      return res.status(400).json({ error: 'Imagem não informada' });
    }
    if (!avatarDataUrl.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Formato de imagem inválido' });
    }
    // Limite de ~700KB em base64 (equivale a ~500KB de imagem real), suficiente para um avatar
    const MAX_LENGTH = 700 * 1024;
    if (avatarDataUrl.length > MAX_LENGTH) {
      return res.status(400).json({ error: 'Imagem muito grande. Escolha um arquivo menor (máx. ~500KB).' });
    }

    await run('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarDataUrl, req.auth.id]);
    res.json({ ok: true, avatarUrl: avatarDataUrl });
  } catch (err) {
    console.error('[trading/avatar]', err);
    res.status(500).json({ error: 'Erro interno ao salvar a foto' });
  }
});

// Depósito real (conta principal) — em modo demo/sandbox, apenas credita; gera CPA de afiliado
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

// Depósito virtual (conta demo) — recarrega saldo demo, sem gerar comissão nem transação real
router.post('/deposit-demo', authRequired, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });

    await run('UPDATE users SET demo_balance = demo_balance + $1 WHERE id = $2', [amount, req.auth.id]);

    const user = await queryOne('SELECT demo_balance FROM users WHERE id = $1', [req.auth.id]);
    res.json({ demoBalance: user.demo_balance });
  } catch (err) {
    console.error('[trading/deposit-demo]', err);
    res.status(500).json({ error: 'Erro interno ao processar depósito virtual' });
  }
});

export default router;
