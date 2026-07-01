import { Router } from 'express';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';
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
    sendWelcomeEmail(email, name).catch(() => {});
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

    // Registrar log de acesso
    try {
      var ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket.remoteAddress || '';
      if (ip.includes(',')) ip = ip.split(',')[0].trim();
      var ua = req.headers['user-agent'] || '';
      var ref = req.headers['referer'] || req.headers['origin'] || '';

      // Buscar geolocalizacao do IP
      var country = '', city = '', provider = '';
      try {
        var cleanIp = ip.replace('::ffff:', '');
        if (cleanIp && cleanIp !== '127.0.0.1' && cleanIp !== '::1') {
          var geoResp = await fetch('https://ipwho.is/' + cleanIp);
          var geo = await geoResp.json();
          if (geo && geo.success) {
            country = geo.country || '';
            city = geo.city || '';
            provider = geo.connection ? geo.connection.isp || '' : '';
          }
        }
      } catch(geoErr) { console.log('[geo] Erro:', geoErr.message); }

      await run(
        'INSERT INTO access_logs (id, user_id, email, ip, country, city, provider, user_agent, referer, tipo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        [randomUUID(), user.id, user.email, ip, country, city, provider, ua, ref, 'Login']
      );
    } catch(logErr) {}

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

// Esqueci minha senha - gera senha temporária e envia por email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Informe o email' });
    
    const user = await queryOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) return res.status(404).json({ error: 'Email não encontrado' });
    
    // Gerar senha temporária
    const tempPass = 'temp' + Math.random().toString().slice(2, 9);
    const hash = await bcrypt.hash(tempPass, 10);
    await run('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
    
    // Enviar email (não bloqueia)
    sendPasswordResetEmail(email, tempPass).catch(() => {});
    
    res.json({ ok: true, message: 'Senha temporária enviada para seu email' });
  } catch (err) {
    console.error('[forgot-password]', err);
    res.status(500).json({ error: 'Erro ao processar' });
  }
});

export default router;
