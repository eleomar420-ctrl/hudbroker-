import { randomUUID } from 'crypto';
import { queryOne, query, withTransaction } from '../db/index.js';
import { priceFeed } from './priceFeed.js';
import { processCommission } from './commissionEngine.js';

/**
 * Motor de execução de opções binárias.
 *
 * Regra de negócio (transparente, sem preço sintético):
 * - O preço de entrada e saída vêm SEMPRE do priceFeed real (Binance).
 * - Se direction === 'up' e exit_price > entry_price -> ganhou
 * - Se direction === 'down' e exit_price < entry_price -> ganhou
 * - Caso contrário -> perdeu
 * - Empate exato -> stake devolvido
 */

const pendingTimers = new Map();

export async function openTrade({ userId, asset, direction, stake, durationSeconds, payoutPct = 0.85 }) {
  const user = await queryOne('SELECT * FROM users WHERE id = $1', [userId]);
  if (!user) throw new Error('Usuário não encontrado');
  if (user.status !== 'active') throw new Error('Conta suspensa');
  if (stake <= 0) throw new Error('Valor de operação inválido');
  if (stake > user.balance) throw new Error('Saldo insuficiente');

  const entryPrice = priceFeed.getPrice(asset);
  if (!entryPrice) throw new Error(`Preço indisponível para ${asset}`);

  const tradeId = randomUUID();
  const openedAt = new Date();
  const expiresAt = new Date(openedAt.getTime() + durationSeconds * 1000);

  await withTransaction(async (client) => {
    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [stake, userId]);
    await client.query(
      `INSERT INTO trades (id, user_id, asset, direction, stake, payout_pct, entry_price, opened_at, expires_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')`,
      [tradeId, userId, asset, direction, stake, payoutPct, entryPrice, openedAt.toISOString(), expiresAt.toISOString()]
    );
    await client.query(
      `INSERT INTO transactions (id, user_id, type, amount, reference_id)
       VALUES ($1, $2, 'trade_stake', $3, $4)`,
      [randomUUID(), userId, -stake, tradeId]
    );
  });

  const timer = setTimeout(() => resolveTrade(tradeId), durationSeconds * 1000);
  pendingTimers.set(tradeId, timer);

  return { tradeId, entryPrice, expiresAt: expiresAt.toISOString() };
}

export async function resolveTrade(tradeId) {
  const trade = await queryOne('SELECT * FROM trades WHERE id = $1', [tradeId]);
  if (!trade || trade.status !== 'open') return;

  const exitPrice = priceFeed.getPrice(trade.asset);
  if (!exitPrice) {
    const retryTimer = setTimeout(() => resolveTrade(tradeId), 1000);
    pendingTimers.set(tradeId, retryTimer);
    return;
  }

  let outcome;
  if (exitPrice === trade.entry_price) {
    outcome = 'draw';
  } else if (trade.direction === 'up') {
    outcome = exitPrice > trade.entry_price ? 'won' : 'lost';
  } else {
    outcome = exitPrice < trade.entry_price ? 'won' : 'lost';
  }

  let resultAmount;
  if (outcome === 'won') {
    resultAmount = trade.stake * (1 + trade.payout_pct);
  } else if (outcome === 'draw') {
    resultAmount = trade.stake;
  } else {
    resultAmount = 0;
  }

  const netResult = resultAmount - trade.stake;

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE trades SET status = $1, exit_price = $2, result_amount = $3 WHERE id = $4`,
      [outcome, exitPrice, netResult, tradeId]
    );
    if (resultAmount > 0) {
      await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [resultAmount, trade.user_id]);
      await client.query(
        `INSERT INTO transactions (id, user_id, type, amount, reference_id)
         VALUES ($1, $2, 'trade_payout', $3, $4)`,
        [randomUUID(), trade.user_id, resultAmount, tradeId]
      );
    }
  });

  pendingTimers.delete(tradeId);

  await processCommission({ userId: trade.user_id, trade: { ...trade, id: tradeId, status: outcome, result_amount: netResult } });

  return { outcome, exitPrice, netResult };
}

export async function getOpenTrades(userId) {
  return query(`SELECT * FROM trades WHERE user_id = $1 AND status = 'open' ORDER BY opened_at DESC`, [userId]);
}

export async function getTradeHistory(userId, limit = 50) {
  return query(
    `SELECT * FROM trades WHERE user_id = $1 AND status != 'open' ORDER BY opened_at DESC LIMIT $2`,
    [userId, limit]
  );
}
