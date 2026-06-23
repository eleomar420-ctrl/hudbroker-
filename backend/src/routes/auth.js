import { Router } from 'express';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { queryOne, run } from '../db/index.js';
import { signToken } from '../middleware/auth.js';
import { attributeSignup } from '../services/commissionEngine.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, lastName, email, phone, country, password, clickId } = req.body;
    if (!name || !lastName || !email || !phone || !password) {
      return res.status(400).json({ error: 'Nome, sobrenome, email, telefone e senha são obrigatórios' });
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) return res.status(409).json({ error: 'Email já cadastrado' });

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    await run(
      `INSERT INTO users (id, name, last_name, email, phone, country, currency, password_hash, balance, demo_balance)
       VALUES ($1, $2, $3, $4, $5, $6, 'BRL', $7, 0, 10000)`,
      [id, name, lastName, email, phone, country || 'BR', passwordHash]
    );

    if (clickId) {
      await attributeSignup({ userId: id, clickId });
    }

    const token = signToken({ id, email, role: 'client' });
    res.json({ token, user: { id, name, lastName, email, balance: 0, demoBalance: 10000, currency: 'BRL' } });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: 'Erro interno ao cadastrar' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
    if (user.status !== 'active') return res.status(403).json({ error: 'Conta suspensa' });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, balance: user.balance, role: user.role }
    });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: 'Erro interno ao entrar' });
  }
});

router.post('/affiliate/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const affiliate = await queryOne('SELECT * FROM affiliates WHERE email = $1', [email]);
    if (!affiliate) return res.status(401).json({ error: 'Credenciais inválidas' });

    const valid = await bcrypt.compare(password, affiliate.password_hash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = signToken({ id: affiliate.id, email: affiliate.email, role: 'affiliate' });
    res.json({
      token,
      affiliate: { id: affiliate.id, name: affiliate.name, refCode: affiliate.ref_code, balance: affiliate.balance }
    });
  } catch (err) {
    console.error('[auth/affiliate/login]', err);
    res.status(500).json({ error: 'Erro interno ao entrar' });
  }
});

export default router;
