import { Router } from 'express';
import { query, queryOne, run } from '../db/index.js';
import { randomUUID } from 'crypto';
import { openTrade } from '../services/tradeEngine.js';

const router = Router();

// ─── Listar masters disponiveis ───
router.get('/masters', async (req, res) => {
  try {
    var masters = await query(
      `SELECT m.*, u.name as user_name, u.email,
       (SELECT COUNT(*) FROM copy_trade_followers WHERE master_id = m.id AND is_active = true) as followers_count
       FROM copy_trade_masters m LEFT JOIN users u ON m.user_id = u.id
       WHERE m.is_active = true ORDER BY m.win_rate DESC`
    );
    res.json(masters);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Seguir um master ───
router.post('/follow', async (req, res) => {
  try {
    var { masterId, stakeMode, fixedAmount, percentAmount } = req.body;
    var userId = req.auth.id;

    var master = await queryOne('SELECT * FROM copy_trade_masters WHERE id = $1 AND is_active = true', [masterId]);
    if (!master) return res.status(404).json({ error: 'Trader nao encontrado' });

    if (master.user_id === userId) return res.status(400).json({ error: 'Voce nao pode copiar suas proprias operacoes' });

    var existing = await queryOne('SELECT * FROM copy_trade_followers WHERE master_id = $1 AND user_id = $2', [masterId, userId]);
    if (existing) {
      await run('UPDATE copy_trade_followers SET is_active = true, stake_mode = $1, fixed_amount = $2, percent_amount = $3 WHERE id = $4',
        [stakeMode || 'fixed', fixedAmount || 5, percentAmount || 5, existing.id]);
      return res.json({ ok: true, message: 'Configuracao atualizada' });
    }

    var id = randomUUID();
    await run(
      `INSERT INTO copy_trade_followers (id, master_id, user_id, stake_mode, fixed_amount, percent_amount)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, masterId, userId, stakeMode || 'fixed', fixedAmount || 5, percentAmount || 5]
    );
    res.json({ ok: true, message: 'Voce esta copiando este trader!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Parar de seguir ───
router.post('/unfollow', async (req, res) => {
  try {
    var { masterId } = req.body;
    await run('UPDATE copy_trade_followers SET is_active = false WHERE master_id = $1 AND user_id = $2', [masterId, req.auth.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Minhas copias ativas ───
router.get('/my-follows', async (req, res) => {
  try {
    var follows = await query(
      `SELECT f.*, m.name as master_name, m.win_rate, m.total_trades, m.total_profit,
       (SELECT COUNT(*) FROM copy_trade_followers WHERE master_id = m.id AND is_active = true) as followers_count
       FROM copy_trade_followers f
       LEFT JOIN copy_trade_masters m ON f.master_id = m.id
       WHERE f.user_id = $1 ORDER BY f.created_at DESC`,
      [req.auth.id]
    );
    res.json(follows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Historico de copias do usuario ───
router.get('/my-history', async (req, res) => {
  try {
    var logs = await query(
      `SELECT l.*, m.name as master_name FROM copy_trade_log l
       LEFT JOIN copy_trade_masters m ON l.master_id = m.id
       WHERE l.follower_id = $1 ORDER BY l.created_at DESC LIMIT 50`,
      [req.auth.id]
    );
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN: Criar master ───
router.post('/admin/masters', async (req, res) => {
  try {
    var { userId, name, description } = req.body;
    var user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);
    if (!user) return res.status(404).json({ error: 'Usuario nao encontrado' });

    var id = randomUUID();
    await run(
      'INSERT INTO copy_trade_masters (id, user_id, name, description) VALUES ($1,$2,$3,$4)',
      [id, userId, name || user.name, description || '']
    );
    res.json({ ok: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN: Listar masters ───
router.get('/admin/masters', async (req, res) => {
  try {
    var masters = await query(
      `SELECT m.*, u.email,
       (SELECT COUNT(*) FROM copy_trade_followers WHERE master_id = m.id AND is_active = true) as followers_count
       FROM copy_trade_masters m LEFT JOIN users u ON m.user_id = u.id ORDER BY m.created_at DESC`
    );
    res.json(masters);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ADMIN: Ativar/desativar master ───
router.patch('/admin/masters/:id', async (req, res) => {
  try {
    var { is_active, win_rate, total_trades, name, description } = req.body;
    var updates = [];
    var values = [];
    var idx = 1;

    if (is_active !== undefined) { updates.push('is_active = $' + idx); values.push(is_active); idx++; }
    if (win_rate !== undefined) { updates.push('win_rate = $' + idx); values.push(Number(win_rate)); idx++; }
    if (total_trades !== undefined) { updates.push('total_trades = $' + idx); values.push(Number(total_trades)); idx++; }
    if (name !== undefined) { updates.push('name = $' + idx); values.push(name); idx++; }
    if (description !== undefined) { updates.push('description = $' + idx); values.push(description); idx++; }

    if (updates.length === 0) return res.json({ ok: true });

    values.push(req.params.id);
    await run('UPDATE copy_trade_masters SET ' + updates.join(', ') + ' WHERE id = $' + idx, values);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Funcao chamada quando um master abre trade ───
export async function executeCopyTrades(masterUserId, tradeId, asset, direction, durationSeconds, payoutPct, accountType) {
  try {
    var master = await queryOne('SELECT * FROM copy_trade_masters WHERE user_id = $1 AND is_active = true', [masterUserId]);
    if (!master) return;

    if (accountType !== 'real') return;

    var followers = await query(
      'SELECT f.*, u.balance FROM copy_trade_followers f LEFT JOIN users u ON f.user_id = u.id WHERE f.master_id = $1 AND f.is_active = true',
      [master.id]
    );

    console.log('[copy-trade] Master:', masterUserId, '| Seguidores:', followers.length);

    for (var follower of followers) {
      try {
        // Calcular stake do SEGUIDOR (nunca usar o stake do master)
        var followerStake = 0;
        if (follower.stake_mode === 'percent') {
          followerStake = (Number(follower.balance) || 0) * (Number(follower.percent_amount) || 5) / 100;
        } else {
          // Modo fixo: usar o valor que o lead configurou
          followerStake = Number(follower.fixed_amount) || 5;
        }

        console.log('[copy-trade] Seguidor:', follower.user_id, '| Modo:', follower.stake_mode, '| Valor config:', follower.fixed_amount, '| Stake calculado:', followerStake, '| Saldo:', follower.balance);

        if (followerStake <= 0) continue;
        if (followerStake > (Number(follower.balance) || 0)) {
          console.log('[copy-trade] Saldo insuficiente para', follower.user_id);
          continue;
        }
        followerStake = Math.floor(followerStake * 100) / 100;

        var result = await openTrade({
          userId: follower.user_id,
          accountType: 'real',
          asset: asset,
          direction: direction,
          stake: followerStake,
          durationSeconds: durationSeconds,
          payoutPct: payoutPct
        });

        await run(
          `INSERT INTO copy_trade_log (id, master_trade_id, follower_trade_id, master_id, follower_id, asset, direction, stake)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [randomUUID(), tradeId, result.tradeId, master.id, follower.user_id, asset, direction, followerStake]
        );

        await run('UPDATE copy_trade_followers SET total_copied = total_copied + 1 WHERE id = $1', [follower.id]);

        console.log('[copy-trade] OK! Copiado para', follower.user_id, '- stake:', followerStake);
      } catch (followerErr) {
        console.error('[copy-trade] Erro seguidor', follower.user_id, followerErr.message);
      }
    }

    await run('UPDATE copy_trade_masters SET total_trades = total_trades + 1 WHERE id = $1', [master.id]);

  } catch (err) {
    console.error('[copy-trade] Erro geral:', err.message);
  }
}

export default router;
