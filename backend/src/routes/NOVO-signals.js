import { Router } from 'express';
import { query, queryOne, run } from '../db/index.js';
import crypto from 'crypto';

const router = Router();

const EVOLUTION_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || '';

// ─── Enviar via Evolution API ───
async function sendWhatsApp(groupId, message) {
  if (!EVOLUTION_URL || !EVOLUTION_KEY || !EVOLUTION_INSTANCE) {
    console.log('[signals] Evolution API nao configurada. Mensagem nao enviada.');
    return { ok: false, reason: 'not_configured' };
  }
  try {
    const resp = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY
      },
      body: JSON.stringify({
        number: groupId,
        text: message
      })
    });
    const data = await resp.json();
    console.log('[signals] Mensagem enviada:', data);
    return { ok: true, data };
  } catch (err) {
    console.error('[signals] Erro ao enviar:', err.message);
    return { ok: false, reason: err.message };
  }
}

// ─── Formatar sinal de trading ───
function formatSignal(signal) {
  var dir = signal.direction === 'buy' ? '⬆️ COMPRA' : '⬇️ VENDA';
  var conf = signal.confidence === 'high' ? '🔥 Alta' : signal.confidence === 'medium' ? '⚡ Media' : '💡 Baixa';
  var msg = '📊 *SINAL DE ENTRADA*\n\n';
  msg += '🪙 Ativo: *' + signal.asset + '*\n';
  msg += '📍 Direcao: *' + dir + '*\n';
  msg += '⏱ Tempo: *' + signal.expiration + '*\n';
  msg += '🎯 Confianca: ' + conf + '\n';
  if (signal.notes) msg += '\n💬 ' + signal.notes + '\n';
  msg += '\n🏦 Opere na HudBroker: ' + (process.env.APP_URL || 'https://hud-broker.com');
  return msg;
}

// ─── POST /api/signals - Criar sinal/mensagem ───
router.post('/', async (req, res) => {
  try {
    var { type, asset, direction, expiration, confidence, notes, message, group_id, scheduled_at } = req.body;

    var id = 'sig_' + crypto.randomBytes(8).toString('hex');
    var content = '';

    if (type === 'signal') {
      content = formatSignal({ asset, direction, expiration, confidence, notes });
    } else {
      content = message || '';
    }

    if (!content) return res.status(400).json({ error: 'Conteudo vazio' });

    var status = 'pending';
    var scheduledTime = scheduled_at ? new Date(scheduled_at) : null;

    // Se nao tem agendamento, enviar agora
    if (!scheduledTime || scheduledTime <= new Date()) {
      if (group_id) {
        var result = await sendWhatsApp(group_id, content);
        status = result.ok ? 'sent' : 'failed';
      } else {
        status = 'draft';
      }
    } else {
      status = 'scheduled';
    }

    await run(
      `INSERT INTO signals (id, type, content, group_id, status, scheduled_at, created_at, asset, direction, expiration, confidence, notes)
       VALUES ($1,$2,$3,$4,$5,$6,now(),$7,$8,$9,$10,$11)`,
      [id, type || 'message', content, group_id || null, status, scheduledTime, asset || null, direction || null, expiration || null, confidence || null, notes || null]
    );

    res.json({ ok: true, id, status, content });
  } catch (err) {
    console.error('[signals]', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/signals - Listar sinais ───
router.get('/', async (req, res) => {
  try {
    var signals = await query(
      `SELECT * FROM signals ORDER BY
        CASE WHEN status = 'scheduled' THEN 0 WHEN status = 'pending' THEN 1 WHEN status = 'sent' THEN 2 ELSE 3 END,
        created_at DESC
       LIMIT 100`
    );
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/signals/:id ───
router.delete('/:id', async (req, res) => {
  try {
    await run('DELETE FROM signals WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/signals/:id/send - Enviar manualmente ───
router.post('/:id/send', async (req, res) => {
  try {
    var signal = await queryOne('SELECT * FROM signals WHERE id = $1', [req.params.id]);
    if (!signal) return res.status(404).json({ error: 'Sinal nao encontrado' });

    if (!signal.group_id) return res.status(400).json({ error: 'Grupo nao definido' });

    var result = await sendWhatsApp(signal.group_id, signal.content);
    var newStatus = result.ok ? 'sent' : 'failed';

    await run('UPDATE signals SET status = $1, sent_at = now() WHERE id = $2', [newStatus, signal.id]);

    res.json({ ok: result.ok, status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/signals/groups - Listar grupos do WhatsApp ───
router.get('/groups', async (req, res) => {
  if (!EVOLUTION_URL || !EVOLUTION_KEY || !EVOLUTION_INSTANCE) {
    return res.json([]);
  }
  try {
    var resp = await fetch(`${EVOLUTION_URL}/group/fetchAllGroups/${EVOLUTION_INSTANCE}`, {
      headers: { 'apikey': EVOLUTION_KEY }
    });
    var groups = await resp.json();
    res.json(groups);
  } catch (err) {
    res.json([]);
  }
});

// ─── GET /api/signals/status - Status da conexao ───
router.get('/status', async (req, res) => {
  if (!EVOLUTION_URL || !EVOLUTION_KEY || !EVOLUTION_INSTANCE) {
    return res.json({ connected: false, reason: 'Variaveis de ambiente nao configuradas' });
  }
  try {
    var resp = await fetch(`${EVOLUTION_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`, {
      headers: { 'apikey': EVOLUTION_KEY }
    });
    var data = await resp.json();
    res.json({ connected: data.state === 'open', data });
  } catch (err) {
    res.json({ connected: false, reason: err.message });
  }
});

// ─── Scheduler: checar sinais agendados (chamar a cada 30s) ───
export async function processScheduledSignals() {
  try {
    var pending = await query(
      `SELECT * FROM signals WHERE status = 'scheduled' AND scheduled_at <= now()`
    );
    for (var signal of pending) {
      if (signal.group_id) {
        var result = await sendWhatsApp(signal.group_id, signal.content);
        var newStatus = result.ok ? 'sent' : 'failed';
        await run('UPDATE signals SET status = $1, sent_at = now() WHERE id = $2', [newStatus, signal.id]);
      }
    }
  } catch (err) {
    console.error('[signals-scheduler]', err.message);
  }
}

export default router;
