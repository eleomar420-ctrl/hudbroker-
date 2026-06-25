import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './db/index.js';
import { priceFeed } from './services/priceFeed.js';
import authRoutes from './routes/auth.js';
import tradingRoutes from './routes/trading.js';
import adminRoutes from './routes/admin.js';
import backofficeRoutes from './routes/backoffice.js';
import affiliateRoutes from './routes/affiliates.js';
import pixRoutes from './routes/pix.js';
import { seedDemoData } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
  await initDb();
  await seedDemoData();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  app.use(express.static(path.join(__dirname, '../public')));

  app.use('/api/auth', authRoutes);
  app.use('/api/trading', tradingRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/backoffice', backofficeRoutes);
  app.use('/api/affiliates', affiliateRoutes);
  app.use('/api/pix', pixRoutes);

  app.get('/api/health', (req, res) => res.json({ ok: true, name: 'HudBroker API' }));

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/prices' });

  priceFeed.on('price', (data) => {
    const payload = JSON.stringify({ type: 'price', ...data });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) client.send(payload);
    });
  });

  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: 'snapshot', prices: priceFeed.getAllPrices() }));
  });

  priceFeed.start();

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`\n  HudBroker rodando na porta ${PORT}\n`);
  });
}

bootstrap().catch((err) => {
  console.error('[bootstrap] Falha ao iniciar o servidor:', err);
  process.exit(1);
});
