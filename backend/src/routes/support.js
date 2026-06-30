import { Router } from 'express';
import { query, queryOne, run } from '../db/index.js';
import crypto from 'crypto';

const router = Router();

// ─── Base de conhecimento (FAQ) ───
const FAQ = [
  { keywords: ['depositar','depósito','deposito','adicionar saldo','colocar dinheiro'], q: 'Como faço para depositar?', a: 'Para depositar, acesse sua conta e clique no botão "Depositar". Aceitamos depósitos via PIX — o valor mínimo é de R$ 30,00. O crédito é instantâneo após a confirmação do pagamento.' },
  { keywords: ['sacar','saque','retirar','retirada','tirar dinheiro'], q: 'Como faço para sacar?', a: 'Acesse o menu e clique em "Sacar". Informe o valor e sua chave PIX. O saque mínimo é de R$ 50,00. O prazo de processamento é de até 24 horas úteis, mas na maioria dos casos é concluído em minutos.' },
  { keywords: ['pix','chave pix','pagamento pix'], q: 'Quais tipos de chave PIX são aceitos?', a: 'Aceitamos todas as chaves PIX: CPF, e-mail, telefone e chave aleatória. Certifique-se de que a chave informada está correta para evitar atrasos no saque.' },
  { keywords: ['operar','trade','trading','operação','abrir operação','como operar','comprar','vender'], q: 'Como faço para operar na plataforma?', a: 'Após fazer login e ter saldo, acesse a tela de trading. Escolha o ativo (ex: EUR/USD), defina o valor da operação, selecione o tempo de expiração e clique em "Comprar" (se acredita que vai subir) ou "Vender" (se acredita que vai cair). Ao final do tempo, se sua previsão estiver correta, você recebe o lucro.' },
  { keywords: ['lucro','ganho','rendimento','payout','quanto ganho','porcentagem'], q: 'Qual é a porcentagem de lucro por operação?', a: 'A porcentagem de lucro (payout) varia de acordo com o ativo e o horário do mercado, podendo chegar até 95%. O valor exato é exibido na tela de operação antes de você confirmar.' },
  { keywords: ['verificar','verificação','documento','identidade','kyc','selfie','comprovar'], q: 'Preciso verificar minha conta?', a: 'Sim, para realizar saques é necessário verificar sua identidade. Acesse "Minha Conta" > "Verificação" e envie uma foto do seu documento (RG ou CNH) e uma selfie. A análise leva até 48 horas.' },
  { keywords: ['conta','cadastro','registrar','criar conta','abrir conta'], q: 'Como crio minha conta?', a: 'Clique em "Criar Conta" na página inicial, preencha seu nome, e-mail e senha. Você receberá um e-mail de confirmação. Após confirmar, sua conta estará pronta para uso.' },
  { keywords: ['senha','esqueci','redefinir','trocar senha','recuperar'], q: 'Esqueci minha senha, o que faço?', a: 'Na tela de login, clique em "Esqueci minha senha". Informe o e-mail cadastrado e enviaremos um link para redefinição. Verifique também a caixa de spam.' },
  { keywords: ['mínimo','valor mínimo','mínimo depósito','mínimo saque','mínimo operação'], q: 'Quais são os valores mínimos?', a: 'Depósito mínimo: R$ 30,00. Saque mínimo: R$ 50,00. Operação mínima: R$ 5,00. Esses valores garantem uma boa experiência na plataforma.' },
  { keywords: ['seguro','segurança','confiável','golpe','fraude','regulamentação'], q: 'A HudBroker é segura?', a: 'Sim! A HudBroker utiliza criptografia de ponta a ponta, autenticação segura com JWT e conexões HTTPS. Seus dados e fundos estão protegidos. Além disso, todos os depósitos e saques são processados via PIX, garantindo rastreabilidade.' },
  { keywords: ['horário','funcionamento','mercado aberto','quando operar','horario'], q: 'Qual o horário de funcionamento?', a: 'A plataforma está disponível 24 horas por dia, 7 dias por semana. Alguns ativos podem ter horários específicos de maior liquidez, mas você pode operar a qualquer momento.' },
  { keywords: ['tempo','expiração','duração','tempo da operação'], q: 'Quais tempos de expiração estão disponíveis?', a: 'Oferecemos operações de 30 segundos, 1 minuto, 5 minutos, 15 minutos e 30 minutos. Escolha o tempo que melhor se adapta à sua estratégia.' },
  { keywords: ['ativo','ativos','par','moeda','crypto','criptomoeda','bitcoin','eur','usd'], q: 'Quais ativos posso operar?', a: 'Disponibilizamos pares de moedas (EUR/USD, GBP/USD, etc.), criptomoedas (BTC/USD, ETH/USD) e outros ativos. A lista completa está disponível na tela de trading.' },
  { keywords: ['demora','pendente','processando','não caiu','cadê','atrasado'], q: 'Meu depósito/saque está demorando, o que faço?', a: 'Depósitos via PIX são normalmente instantâneos. Se não foi creditado em até 10 minutos, entre em contato conosco informando o comprovante. Para saques, o prazo é de até 24 horas úteis. Se ultrapassar esse prazo, fale conosco com seu e-mail e ID de usuário.' }
];

function searchFaq(message) {
  const msg = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let bestMatch = null, bestScore = 0;
  for (const item of FAQ) {
    let score = 0;
    for (const kw of item.keywords) {
      if (msg.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) score++;
    }
    if (score > bestScore) { bestScore = score; bestMatch = item; }
  }
  return bestScore > 0 ? bestMatch : null;
}

const SYSTEM_PROMPT = `Você é a assistente virtual da HudBroker, uma corretora de operações binárias.
Seu nome é Hud IA. Seja simpática, profissional e objetiva.
REGRAS:
- Responda APENAS sobre assuntos relacionados à HudBroker e trading.
- Se a pergunta não for sobre a corretora, diga educadamente que só pode ajudar com assuntos da HudBroker.
- Português brasileiro informal mas profissional. Respostas curtas (máximo 3 parágrafos).
- Não invente informações. Se não souber, oriente a entrar em contato com support@hudbroker.com.
- NUNCA forneça dados pessoais de outros clientes.
INFORMAÇÕES:
- Depósito mínimo: R$ 30 via PIX (instantâneo)
- Saque mínimo: R$ 50 via PIX (até 24h úteis)
- Operação mínima: R$ 5
- Payout: até 95%
- Ativos: EUR/USD, GBP/USD, BTC/USD, ETH/USD e mais
- Tempos: 30s, 1min, 5min, 15min, 30min
- Plataforma 24/7
- KYC necessário para saques
- Email: support@hudbroker.com`;

// ─── Mapa de WebSockets conectados ───
// Populado pelo server.js ao criar o WSS de suporte
export const supportClients = new Map();  // conversationId -> { client: ws, agent: ws }

export function broadcastToConversation(convId, data) {
  const entry = supportClients.get(convId);
  if (!entry) return;
  const payload = JSON.stringify(data);
  if (entry.client?.readyState === 1) entry.client.send(payload);
  if (entry.agent?.readyState === 1) entry.agent.send(payload);
}

// Notificar todos os agentes conectados (no lobby)
export const agentSockets = new Set();
export function notifyAgents(data) {
  const payload = JSON.stringify(data);
  agentSockets.forEach(ws => { if (ws.readyState === 1) ws.send(payload); });
}

// ─── POST /api/support/start ─── Iniciar conversa
router.post('/start', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email obrigatório' });

    // Verificar se já existe conversa aberta pra esse email
    const existing = await queryOne(
      `SELECT * FROM support_conversations WHERE client_email = $1 AND status IN ('bot','waiting','active') ORDER BY created_at DESC LIMIT 1`,
      [email]
    );
    if (existing) {
      const messages = await query(
        `SELECT sender, content, created_at FROM support_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
        [existing.id]
      );
      return res.json({ conversation: existing, messages });
    }

    const id = 'conv_' + crypto.randomBytes(8).toString('hex');
    await run(
      `INSERT INTO support_conversations (id, client_email, status) VALUES ($1, $2, 'bot')`,
      [id, email]
    );
    const conv = await queryOne(`SELECT * FROM support_conversations WHERE id = $1`, [id]);
    return res.json({ conversation: conv, messages: [] });
  } catch (err) {
    console.error('[support/start]', err);
    return res.status(500).json({ error: 'Erro ao iniciar conversa' });
  }
});

// ─── POST /api/support/chat ─── Mensagem do cliente (IA ou FAQ)
router.post('/chat', async (req, res) => {
  try {
    const { email, message, conversationId, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensagem obrigatória' });

    // Salvar mensagem do cliente
    if (conversationId) {
      const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
      await run(
        `INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'client', $3)`,
        [msgId, conversationId, message]
      );
      await run(`UPDATE support_conversations SET updated_at = now() WHERE id = $1`, [conversationId]);

      // Checar se conversa está com humano
      const conv = await queryOne(`SELECT status FROM support_conversations WHERE id = $1`, [conversationId]);
      if (conv && (conv.status === 'active' || conv.status === 'waiting')) {
        // Notificar agente via WebSocket
        broadcastToConversation(conversationId, {
          type: 'message', sender: 'client', content: message, conversationId
        });
        notifyAgents({ type: 'new_message', conversationId, content: message });
        return res.json({ reply: null, source: 'human', status: conv.status });
      }
    }

    // FAQ primeiro
    const faqMatch = searchFaq(message);
    if (faqMatch && history.length <= 2) {
      const reply = faqMatch.a;
      if (conversationId) {
        const rId = 'msg_' + crypto.randomBytes(8).toString('hex');
        await run(`INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'bot', $3)`, [rId, conversationId, reply]);
      }
      return res.json({ reply, source: 'faq', faqQuestion: faqMatch.q });
    }

    // Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const reply = faqMatch
        ? faqMatch.a
        : 'No momento, nosso atendimento inteligente está em manutenção. Por favor, envie sua dúvida para support@hudbroker.com ou clique em "Falar com humano" abaixo.';
      if (conversationId) {
        const rId = 'msg_' + crypto.randomBytes(8).toString('hex');
        await run(`INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'bot', $3)`, [rId, conversationId, reply]);
      }
      return res.json({ reply, source: faqMatch ? 'faq' : 'fallback' });
    }

    const messages = [];
    for (const h of history.slice(-10)) messages.push({ role: h.role, content: h.content });
    messages.push({ role: 'user', content: `[Cliente: ${email}]\n${message}` });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 500, system: SYSTEM_PROMPT, messages })
    });

    if (!response.ok) {
      if (faqMatch) return res.json({ reply: faqMatch.a, source: 'faq' });
      throw new Error(`API ${response.status}`);
    }

    const data = await response.json();
    const reply = data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
    if (conversationId) {
      const rId = 'msg_' + crypto.randomBytes(8).toString('hex');
      await run(`INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'bot', $3)`, [rId, conversationId, reply]);
    }
    return res.json({ reply, source: 'ai' });

  } catch (err) {
    console.error('[support/chat]', err.message);
    return res.json({ reply: 'Desculpe, tive um problema técnico. Tente novamente ou clique em "Falar com humano".', source: 'error' });
  }
});

// ─── POST /api/support/request-human ─── Solicitar atendente humano
router.post('/request-human', async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) return res.status(400).json({ error: 'conversationId obrigatório' });

    await run(`UPDATE support_conversations SET status = 'waiting', updated_at = now() WHERE id = $1`, [conversationId]);

    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await run(
      `INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'system', $3)`,
      [msgId, conversationId, 'Cliente solicitou atendimento humano. Aguardando atendente...']
    );

    // Notificar agentes
    const conv = await queryOne(`SELECT * FROM support_conversations WHERE id = $1`, [conversationId]);
    notifyAgents({ type: 'new_waiting', conversation: conv });

    return res.json({ ok: true, message: 'Solicitação enviada! Um atendente vai te atender em breve.' });
  } catch (err) {
    console.error('[support/request-human]', err);
    return res.status(500).json({ error: 'Erro ao solicitar atendente' });
  }
});

// ─── GET /api/support/conversations ─── Listar conversas (para agentes)
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await query(
      `SELECT c.*, (SELECT COUNT(*) FROM support_messages WHERE conversation_id = c.id) as msg_count,
       (SELECT content FROM support_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM support_conversations c ORDER BY
         CASE WHEN c.status = 'waiting' THEN 0 WHEN c.status = 'active' THEN 1 WHEN c.status = 'bot' THEN 2 ELSE 3 END,
         c.updated_at DESC`
    );
    return res.json(conversations);
  } catch (err) {
    console.error('[support/conversations]', err);
    return res.status(500).json({ error: 'Erro ao listar conversas' });
  }
});

// ─── GET /api/support/conversations/:id/messages ───
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await query(
      `SELECT * FROM support_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [req.params.id]
    );
    const conv = await queryOne(`SELECT * FROM support_conversations WHERE id = $1`, [req.params.id]);
    return res.json({ conversation: conv, messages });
  } catch (err) {
    return res.status(500).json({ error: 'Erro' });
  }
});

// ─── POST /api/support/conversations/:id/reply ─── Agente envia mensagem
router.post('/conversations/:id/reply', async (req, res) => {
  try {
    const { content, agentName = 'Atendente' } = req.body;
    const convId = req.params.id;
    if (!content) return res.status(400).json({ error: 'Conteúdo obrigatório' });

    // Marcar como ativo se estava aguardando
    const conv = await queryOne(`SELECT status FROM support_conversations WHERE id = $1`, [convId]);
    if (conv && conv.status === 'waiting') {
      await run(`UPDATE support_conversations SET status = 'active', assigned_agent = $1, updated_at = now() WHERE id = $2`, [agentName, convId]);
    } else {
      await run(`UPDATE support_conversations SET updated_at = now() WHERE id = $1`, [convId]);
    }

    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await run(
      `INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'agent', $3)`,
      [msgId, convId, content]
    );

    // Enviar via WebSocket para o cliente
    broadcastToConversation(convId, {
      type: 'message', sender: 'agent', content, agentName, conversationId: convId
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error('[support/reply]', err);
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// ─── POST /api/support/conversations/:id/close ─── Fechar conversa
router.post('/conversations/:id/close', async (req, res) => {
  try {
    await run(`UPDATE support_conversations SET status = 'closed', updated_at = now() WHERE id = $1`, [req.params.id]);
    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await run(
      `INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'system', $3)`,
      [msgId, req.params.id, 'Atendimento encerrado. Obrigado pelo contato!']
    );
    broadcastToConversation(req.params.id, { type: 'closed', conversationId: req.params.id });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao fechar conversa' });
  }
});

// ─── GET /api/support/faq ───
router.get('/faq', (req, res) => res.json(FAQ.map(f => ({ q: f.q, a: f.a }))));

export default router;
