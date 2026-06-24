import { Router } from 'express';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { queryOne, run, withTransaction } from '../db/index.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { registerClick, getAffiliateStats } from '../services/commissionEngine.js';

const router = Router();

router.post('/track', async (req, res) => {
  try {
    const { refCode } = req.body;
    const result = await registerClick({ refCode, ip: req.ip, userAgent: req.headers['user-agent'] });
    if (!result) return res.status(404).json({ error: 'Código de afiliado inválido' });
    res.json(result);
  } catch (err) {
    console.error('[affiliates/track]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const existing = await queryOne('SELECT id FROM affiliates WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'Email já cadastrado' });

    const id = randomUUID();
    const refCode = id.slice(0, 8).toUpperCase();
    const passwordHash = await bcrypt.hash(password, 10);

    await run(
      `INSERT INTO affiliates (id, name, email, password_hash, ref_code) VALUES ($1, $2, $3, $4, $5)`,
      [id, name, email, passwordHash, refCode]
    );

    res.json({ id, refCode });
  } catch (err) {
    console.error('[affiliates/register]', err);
    res.status(500).json({ error: 'Erro interno ao cadastrar' });
  }
});

router.use(authRequired, requireRole('affiliate'));

router.get('/me/stats', async (req, res) => {
  res.json(await getAffiliateStats(req.auth.id));
});

router.post('/me/withdraw', async (req, res) => {
  try {
    const { amount } = req.body;
    const affiliate = await queryOne('SELECT * FROM affiliates WHERE id = $1', [req.auth.id]);

    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valor inválido' });
    if (amount > affiliate.balance) return res.status(400).json({ error: 'Saldo insuficiente' });

    await withTransaction(async (client) => {
      await client.query('UPDATE affiliates SET balance = balance - $1 WHERE id = $2', [amount, req.auth.id]);
      await client.query(
        `INSERT INTO withdrawal_requests (id, requester_type, requester_id, amount) VALUES ($1, 'affiliate', $2, $3)`,
        [randomUUID(), req.auth.id, amount]
      );
    });

    res.json({ ok: true, message: 'Solicitação de saque enviada para aprovação' });
  } catch (err) {
    console.error('[affiliates/withdraw]', err);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
