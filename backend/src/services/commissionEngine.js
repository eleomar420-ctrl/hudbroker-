import { randomUUID } from 'crypto';
import { query, queryOne, run, withTransaction } from '../db/index.js';

/**
 * Registra um clique de afiliado e devolve o click_id para salvar em cookie no frontend.
 */
export async function registerClick({ refCode, ip, userAgent }) {
  const affiliate = await queryOne(
    'SELECT * FROM affiliates WHERE ref_code = $1 AND status = $2',
    [refCode, 'active']
  );
  if (!affiliate) return null;

  const clickId = randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // janela de 30 dias

  await run(
    `INSERT INTO clicks (id, affiliate_id, click_id, ip, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [randomUUID(), affiliate.id, clickId, ip, userAgent, expiresAt.toISOString()]
  );

  return { clickId, affiliateId: affiliate.id };
}

/**
 * Vincula um usuário recém-cadastrado ao afiliado do clique, se a janela ainda for válida.
 */
export async function attributeSignup({ userId, clickId }) {
  if (!clickId) return null;

  const click = await queryOne(
    `SELECT * FROM clicks WHERE click_id = $1 AND converted_user_id IS NULL AND expires_at > now()`,
    [clickId]
  );
  if (!click) return null; // expirado ou já convertido

  await withTransaction(async (client) => {
    await client.query('UPDATE users SET affiliate_id = $1 WHERE id = $2', [click.affiliate_id, userId]);
    await client.query('UPDATE clicks SET converted_user_id = $1 WHERE id = $2', [userId, click.id]);
  });

  return click.affiliate_id;
}

/**
 * CPA: paga valor fixo no PRIMEIRO depósito do cliente trazido pelo afiliado.
 */
export async function processFirstDeposit({ userId }) {
  const user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user || !user.affiliate_id) return;

  const alreadyPaid = await queryOne(
    `SELECT 1 FROM commission_events WHERE user_id = $1 AND type = 'cpa' LIMIT 1`,
    [userId]
  );
  if (alreadyPaid) return;

  const affiliate = await queryOne('SELECT * FROM affiliates WHERE id = $1', [user.affiliate_id]);
  if (!affiliate || affiliate.commission_model === 'revshare') return;

  const cpaAmount = affiliate.cpa_amount;

  await withTransaction(async (client) => {
    await client.query('UPDATE affiliates SET balance = balance + $1 WHERE id = $2', [cpaAmount, affiliate.id]);
    await client.query(
      `INSERT INTO commission_events (id, affiliate_id, user_id, type, amount, source_id)
       VALUES ($1, $2, $3, 'cpa', $4, $5)`,
      [randomUUID(), affiliate.id, userId, cpaAmount, userId]
    );
  });
}

/**
 * Revenue share: paga % sobre o RESULTADO NEGATIVO do cliente em cada operação.
 */
export async function processCommission({ userId, trade }) {
  const user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user || !user.affiliate_id) return;

  const affiliate = await queryOne('SELECT * FROM affiliates WHERE id = $1', [user.affiliate_id]);
  if (!affiliate || affiliate.commission_model === 'cpa') return;

  if (trade.result_amount >= 0) return; // cliente ganhou ou empatou, sem comissão revshare

  const houseResult = Math.abs(trade.result_amount);
  const commissionAmount = houseResult * affiliate.revshare_pct;

  await withTransaction(async (client) => {
    await client.query('UPDATE affiliates SET balance = balance + $1 WHERE id = $2', [commissionAmount, affiliate.id]);
    await client.query(
      `INSERT INTO commission_events (id, affiliate_id, user_id, type, amount, source_id)
       VALUES ($1, $2, $3, 'revshare', $4, $5)`,
      [randomUUID(), affiliate.id, userId, commissionAmount, trade.id]
    );
  });
}

export async function getAffiliateStats(affiliateId) {
  const affiliate = await queryOne(
    `SELECT id, name, email, ref_code, commission_model, cpa_amount, revshare_pct, balance, status, created_at
     FROM affiliates WHERE id = $1`,
    [affiliateId]
  );
  const totalClicks = (await queryOne('SELECT COUNT(*) as c FROM clicks WHERE affiliate_id = $1', [affiliateId])).c;
  const totalSignups = (await queryOne('SELECT COUNT(*) as c FROM users WHERE affiliate_id = $1', [affiliateId])).c;
  const totalCommission = (await queryOne(
    'SELECT COALESCE(SUM(amount), 0) as total FROM commission_events WHERE affiliate_id = $1',
    [affiliateId]
  )).total;
  const events = await query(
    'SELECT * FROM commission_events WHERE affiliate_id = $1 ORDER BY created_at DESC LIMIT 50',
    [affiliateId]
  );

  return { affiliate, totalClicks: Number(totalClicks), totalSignups: Number(totalSignups), totalCommission: Number(totalCommission), events };
}
