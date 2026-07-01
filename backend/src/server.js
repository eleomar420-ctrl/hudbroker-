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
import supportRoutes, { supportClients, agentSockets } from './routes/support.js';
import signalsRoutes, { processScheduledSignals } from './routes/signals.js';
import { seedDemoData } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function bootstrap() {
  await initDb();
  await seedDemoData();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

  // Redirecionar HTTP para HTTPS em produção
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] === 'http') {
      return res.redirect(301, 'https://' + req.hostname + req.url);
    }
    next();
  });

  // Redirecionar landing page para login
  app.get('/', (req, res) => res.redirect('/login'));

  app.use(express.static(path.join(__dirname, '../public'), { extensions: ['html'] }));

  // URLs limpas (sem .html)
  app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/client/login.html')));
  app.get('/register', (req, res) => res.sendFile(path.join(__dirname, '../public/client/register.html')));
  app.get('/trade', (req, res) => res.sendFile(path.join(__dirname, '../public/client/index.html')));
  app.get('/withdraw', (req, res) => res.sendFile(path.join(__dirname, '../public/client/withdraw.html')));
  app.get('/verify', (req, res) => res.sendFile(path.join(__dirname, '../public/client/verify.html')));
  app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/index.html')));
  app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/login.html')));
  app.get('/admin/suporte', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/suporte.html')));
  app.get('/admin/sinais', (req, res) => res.sendFile(path.join(__dirname, '../public/admin/sinais.html')));

  app.use('/api/auth', authRoutes);
  app.use('/api/trading', tradingRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/backoffice', backofficeRoutes);
  app.use('/api/affiliates', affiliateRoutes);
  app.use('/api/pix', pixRoutes);
  app.use('/api/support', supportRoutes);
  app.use('/api/signals', signalsRoutes);

  // Agendar verificacao de sinais a cada 30s
  setInterval(processScheduledSignals, 30000);

  app.get('/api/health', (req, res) => res.json({ ok: true, name: 'HudBroker API' }));

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/prices' });

  // ─── WebSocket de Suporte ───
  const supportWss = new WebSocketServer({ server: httpServer, path: '/ws/support' });

  supportWss.on('connection', (ws) => {
    let role = null;
    let convId = null;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);

        // Registro: cliente ou agente se identifica
        if (msg.type === 'register') {
          role = msg.role; // 'client' ou 'agent'
          convId = msg.conversationId;

          if (role === 'agent' && !convId) {
            // Agente no lobby (vendo todas as conversas)
            agentSockets.add(ws);
          } else if (convId) {
            if (!supportClients.has(convId)) supportClients.set(convId, {});
            const entry = supportClients.get(convId);
            entry[role] = ws;
          }
        }
      } catch (e) { /* ignore */ }
    });

    ws.on('close', () => {
      agentSockets.delete(ws);
      if (convId && supportClients.has(convId)) {
        const entry = supportClients.get(convId);
        if (entry[role] === ws) entry[role] = null;
        if (!entry.client && !entry.agent) supportClients.delete(convId);
      }
    });
  });

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
