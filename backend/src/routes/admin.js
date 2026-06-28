import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne, run } from '../db/index.js';
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

// Editar saldo do usuário
router.patch('/users/:id/balance', async (req, res) => {
  try {
    const { balance, demo_balance } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;
    if (balance !== undefined) { updates.push(`balance = $${idx++}`); values.push(Number(balance)); }
    if (demo_balance !== undefined) { updates.push(`demo_balance = $${idx++}`); values.push(Number(demo_balance)); }
    if (!updates.length) return res.status(400).json({ error: 'Nada para atualizar' });
    values.push(req.params.id);
    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Detalhes de um usuário
router.get('/users/:id', async (req, res) => {
  try {
    const user = await queryOne('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    delete user.password_hash;
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Listar depósitos (pix_charges)
router.get('/deposits', async (req, res) => {
  try {
    const deposits = await query(
      `SELECT p.*, u.name, u.email FROM pix_charges p LEFT JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 100`
    );
    res.json(deposits);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Listar saques
router.get('/withdrawals', async (req, res) => {
  try {
    const rows = await query(
      `SELECT w.*, u.name, u.email FROM withdrawals w LEFT JOIN users u ON w.user_id = u.id ORDER BY w.created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Aprovar saque
router.patch('/withdrawals/:id/approve', async (req, res) => {
  try {
    await run("UPDATE withdrawals SET status = 'approved', updated_at = now() WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Rejeitar saque
router.patch('/withdrawals/:id/reject', async (req, res) => {
  try {
    const w = await queryOne('SELECT * FROM withdrawals WHERE id = $1', [req.params.id]);
    if (w && w.status === 'pending') {
      await run('UPDATE users SET balance = balance + $1 WHERE id = $2', [w.amount, w.user_id]);
      await run("UPDATE withdrawals SET status = 'rejected', updated_at = now() WHERE id = $1", [req.params.id]);
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Overview completo
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await queryOne('SELECT COUNT(*) as count FROM users WHERE role = $1', ['client']);
    const totalDeposits = await queryOne("SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM pix_charges WHERE status = 'paid'");
    const totalTrades = await queryOne('SELECT COUNT(*) as count FROM trades');
    const todayTrades = await queryOne("SELECT COUNT(*) as count FROM trades WHERE opened_at >= CURRENT_DATE");
    const totalBalance = await queryOne('SELECT COALESCE(SUM(balance),0) as total FROM users');
    res.json({
      users: Number(totalUsers.count),
      deposits: { count: Number(totalDeposits.count), total: Number(totalDeposits.total) },
      trades: { total: Number(totalTrades.count), today: Number(todayTrades.count) },
      totalBalance: Number(totalBalance.total)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Depositos de um usuario
router.get('/users/:id/deposits', async (req, res) => {
  try {
    const deps = await query(
      'SELECT * FROM pix_charges WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(deps);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Saques de um usuario
router.get('/users/:id/withdrawals', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Trades de um usuario
router.get('/users/:id/trades', async (req, res) => {
  try {
    const rows = await query(
      'SELECT * FROM trades WHERE user_id = $1 ORDER BY opened_at DESC LIMIT 100',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Total depositos de um usuario
router.get('/users/:id/totals', async (req, res) => {
  try {
    const deps = await queryOne("SELECT COALESCE(SUM(amount),0) as total FROM pix_charges WHERE user_id = $1 AND status = 'paid'", [req.params.id]);
    const saqs = await queryOne("SELECT COALESCE(SUM(amount),0) as total FROM withdrawals WHERE user_id = $1 AND status = 'approved'", [req.params.id]);
    const ops = await queryOne("SELECT COUNT(*) as count FROM trades WHERE user_id = $1", [req.params.id]);
    res.json({
      deposits: Number(deps.total),
      withdrawals: Number(saqs.total),
      trades: Number(ops.count)
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Listar documentos KYC de um usuario
router.get('/users/:id/kyc-documents', async (req, res) => {
  try {
    const docs = await query(
      'SELECT * FROM kyc_documents WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(docs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Aprovar/Rejeitar documento KYC
router.patch('/kyc-documents/:id', async (req, res) => {
  try {
    const { status } = req.body;
    await run('UPDATE kyc_documents SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Aprovar/Rejeitar conta (KYC status)
router.patch('/users/:id/kyc-approve', async (req, res) => {
  try {
    const { status } = req.body;
    await run('UPDATE users SET kyc_status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Alterar senha do usuario
router.patch('/users/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Senha precisa ter no mínimo 6 caracteres' });
    const hash = await bcrypt.hash(password, 10);
    await run('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
