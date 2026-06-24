import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { queryOne, run } from './db/index.js';

export async function seedDemoData() {
  const adminExists = await queryOne("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (!adminExists) {
    const id = randomUUID();
    const hash = await bcrypt.hash('admin123', 10);
    await run(
      `INSERT INTO users (id, name, email, password_hash, role, balance)
       VALUES ($1, 'Administrador', 'admin@hudbroker.com', $2, 'admin', 0)`,
      [id, hash]
    );
    console.log('[seed] Admin criado: admin@hudbroker.com / admin123');
  }

  const affiliateExists = await queryOne('SELECT id FROM affiliates LIMIT 1');
  if (!affiliateExists) {
    const id = randomUUID();
    const hash = await bcrypt.hash('afiliado123', 10);
    const refCode = 'DEMO0001';
    await run(
      `INSERT INTO affiliates (id, name, email, password_hash, ref_code, commission_model, cpa_amount, revshare_pct)
       VALUES ($1, 'Afiliado Demo', 'afiliado@hudbroker.com', $2, $3, 'hybrid', 50, 0.20)`,
      [id, hash, refCode]
    );
    console.log(`[seed] Afiliado demo criado: afiliado@hudbroker.com / afiliado123 (ref: ${refCode})`);
  }
}
