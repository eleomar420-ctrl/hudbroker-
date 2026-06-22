import { Router } from 'express';
import { query, queryOne } from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired, requireRole('admin'));

router.get('/overview', async (req, res) => {
  const totalUsers = Number((await queryOne("SELECT COUNT(*) as c FROM users WHERE role = $1", ['client'])).c);
  const totalTrades = Number((await queryOne('SELECT COUNT(*) as c FROM trades')).c);
  const openTrades = Number((await queryOne("SELECT COUNT(*) as c FROM trades WHERE status = 'open'")).c);
  const totalDeposits = Number((await queryOne(
    "SELECT COALESCE(SUM(amount), 0) as t FROM transactions WHERE type = 'deposit'"
  )).t);
  const houseResult = Number((await queryOne(
    "SELECT COALESCE(SUM(-result_amount), 0) as t FROM trades WHERE status IN ('won', 'lost')"
  )).t);

  res.json({ totalUsers, totalTrades, openTrades, totalDeposits, houseResult });
});

router.get('/users', async (req, res) => {
  const users = await query(`
    SELECT id, name, email, balance, kyc_status, status, affiliate_id, created_at
    FROM users WHERE role = 'client' ORDER BY created_at DESC
  `);
  res.json(users);
});

router.patch('/users/:id/status', async (req, res) => {
  const { status } = req.body;
  await query('UPDATE users SET status = $1 WHERE id = $2', [status, req.params.id]);
  res.json({ ok: true });
});

router.patch('/users/:id/kyc', async (req, res) => {
  const { kyc_status } = req.body;
  await query('UPDATE users SET kyc_status = $1 WHERE id = $2', [kyc_status, req.params.id]);
  res.json({ ok: true });
});

router.get('/trades', async (req, res) => {
  const trades = await query(`
    SELECT t.*, u.name as user_name, u.email as user_email
    FROM trades t JOIN users u ON u.id = t.user_id
    ORDER BY t.opened_at DESC LIMIT 200
  `);
  res.json(trades);
});

router.get('/affiliates', async (req, res) => {
  const affiliates = await query(`
    SELECT id, name, email, ref_code, commission_model, cpa_amount, revshare_pct, balance, status, created_at
    FROM affiliates ORDER BY created_at DESC
  `);
  res.json(affiliates);
});

export default router;
