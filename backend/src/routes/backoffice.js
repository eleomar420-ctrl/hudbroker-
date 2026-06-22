import { Router } from 'express';
import { query, queryOne, withTransaction } from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authRequired, requireRole('admin', 'support'));

router.get('/withdrawals', async (req, res) => {
  const status = req.query.status || 'pending';
  const withdrawals = await query(
    'SELECT * FROM withdrawal_requests WHERE status = $1 ORDER BY created_at DESC',
    [status]
  );
  res.json(withdrawals);
});

router.patch('/withdrawals/:id', async (req, res) => {
  try {
    const { action } = req.body;
    const withdrawal = await queryOne('SELECT * FROM withdrawal_requests WHERE id = $1', [req.params.id]);
    if (!withdrawal) return res.status(404).json({ error: 'Solicitação não encontrada' });
    if (withdrawal.status !== 'pending') return res.status(400).json({ error: 'Já foi processada' });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE withdrawal_requests SET status = $1, reviewed_by = $2, reviewed_at = now() WHERE id = $3`,
        [newStatus, req.auth.id, req.params.id]
      );

      if (action === 'reject') {
        if (withdrawal.requester_type === 'user') {
          await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [withdrawal.amount, withdrawal.requester_id]);
        } else {
          await client.query('UPDATE affiliates SET balance = balance + $1 WHERE id = $2', [withdrawal.amount, withdrawal.requester_id]);
        }
      }
    });

    res.json({ ok: true, status: newStatus });
  } catch (err) {
    console.error('[backoffice/withdrawals]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.get('/users/:id', async (req, res) => {
  const user = await queryOne(
    `SELECT id, name, email, balance, affiliate_id, kyc_status, role, status, created_at FROM users WHERE id = $1`,
    [req.params.id]
  );
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
  const trades = await query('SELECT * FROM trades WHERE user_id = $1 ORDER BY opened_at DESC LIMIT 50', [req.params.id]);
  const transactions = await query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.params.id]);
  res.json({ user, trades, transactions });
});

export default router;
