import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('[db] ERRO: variável de ambiente DATABASE_URL não definida.');
  console.error('[db] No Railway: adicione um serviço PostgreSQL ao projeto, ele injeta DATABASE_URL automaticamente.');
  console.error('[db] Localmente: defina DATABASE_URL no arquivo .env (veja .env.example).');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
});

/**
 * Camada fina sobre o pool do pg, com uma API parecida com a do better-sqlite3
 * (porém assíncrona) para reduzir a quantidade de mudanças no resto do código:
 *   - query(sql, params)        -> roda e devolve todas as linhas
 *   - queryOne(sql, params)     -> roda e devolve a primeira linha (ou undefined)
 *   - run(sql, params)          -> roda um INSERT/UPDATE/DELETE
 *   - withTransaction(fn)       -> executa fn dentro de uma transação, com client dedicado
 */
export async function query(sql, params = []) {
  const result = await pool.query(sql, params);
  return result.rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0];
}

export async function run(sql, params = []) {
  return pool.query(sql, params);
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.pg.sql'), 'utf-8');
  await pool.query(schema);

  // Migrações incrementais: adicionam colunas novas a bancos já existentes
  // (CREATE TABLE IF NOT EXISTS não altera tabelas que já existem).
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'BR';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'BRL';
    ALTER TABLE users ADD COLUMN IF NOT EXISTS demo_balance DOUBLE PRECISION NOT NULL DEFAULT 10000;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'demo';
  `);

  console.log('[db] Schema PostgreSQL inicializado/verificado');
}

export default pool;
