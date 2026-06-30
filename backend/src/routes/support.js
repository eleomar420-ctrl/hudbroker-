import { Router } from 'express';
import { query, queryOne, run } from '../db/index.js';
import crypto from 'crypto';

const router = Router();

const FAQ = [
  {
    keywords: ['depositar','deposito','depositar dinheiro','adicionar saldo','colocar dinheiro','como depositar'],
    q: 'Como faco para depositar?',
    a: 'Para depositar, clique no botao "Depositar" na plataforma. O deposito e feito exclusivamente via PIX. O valor minimo e de R$ 75,00. Apos o pagamento, o saldo e creditado automaticamente em poucos segundos.'
  },
  {
    keywords: ['sacar','saque','retirar','retirada','tirar dinheiro','como sacar','resgatar'],
    q: 'Como faco para sacar?',
    a: 'Acesse o menu lateral e clique em "Sacar". Informe o valor desejado (minimo R$ 150,00) e sua chave PIX. Saques sao processados em ate 24 horas uteis, mas a maioria e concluida em poucos minutos. E necessario ter a conta verificada para solicitar saques.'
  },
  {
    keywords: ['pix','chave pix','pagamento pix','tipo de pix','qual pix'],
    q: 'Quais tipos de chave PIX sao aceitos?',
    a: 'Aceitamos todas as chaves PIX: CPF, e-mail, telefone e chave aleatoria. Verifique se a chave esta correta antes de solicitar o saque para evitar atrasos.'
  },
  {
    keywords: ['operar','trade','trading','como operar','comprar','vender','operacao','abrir operacao'],
    q: 'Como opero na plataforma?',
    a: 'Apos depositar, escolha o ativo na tela de trading (ex: BTC/USDT), defina o valor da operacao, selecione o tempo de expiracao e clique em "Comprar" (se acredita que vai subir) ou "Vender" (se acredita que vai cair). Se sua previsao estiver correta ao final do tempo, voce recebe o lucro sobre o valor operado.'
  },
  {
    keywords: ['lucro','ganho','rendimento','payout','quanto ganho','porcentagem','retorno'],
    q: 'Qual e a porcentagem de lucro?',
    a: 'O payout (porcentagem de lucro) padrao e de 85%, podendo variar conforme o ativo e o horario. O valor exato e sempre exibido na tela antes de voce confirmar a operacao.'
  },
  {
    keywords: ['verificar','verificacao','documento','identidade','kyc','selfie','comprovar','verificar conta'],
    q: 'Preciso verificar minha conta?',
    a: 'Sim, a verificacao e necessaria para realizar saques. Acesse "Minha Conta" > "Verificar Conta" e envie uma foto do seu documento (RG ou CNH) e uma selfie. A analise leva ate 48 horas.'
  },
  {
    keywords: ['conta','cadastro','registrar','criar conta','abrir conta','como criar'],
    q: 'Como crio minha conta?',
    a: 'Na pagina inicial, clique em "Criar Conta". Preencha seu nome, e-mail e crie uma senha. Apos o cadastro, voce ja pode acessar a plataforma e fazer seu primeiro deposito.'
  },
  {
    keywords: ['senha','esqueci','redefinir','trocar senha','recuperar','nao lembro'],
    q: 'Esqueci minha senha, o que faco?',
    a: 'Na tela de login, clique em "Esqueci minha senha". Informe o e-mail cadastrado e enviaremos um link para redefinicao. Verifique tambem sua caixa de spam caso nao encontre o e-mail.'
  },
  {
    keywords: ['minimo','valor minimo','quanto preciso','minimo deposito','minimo saque','minimo operacao'],
    q: 'Quais sao os valores minimos?',
    a: 'Deposito minimo: R$ 75,00 (via PIX). Saque minimo: R$ 150,00 (via PIX). Operacao minima: o valor minimo por operacao depende do ativo escolhido.'
  },
  {
    keywords: ['seguro','seguranca','confiavel','golpe','fraude'],
    q: 'A HudBroker e segura?',
    a: 'Sim! Utilizamos criptografia em todas as conexoes (HTTPS), autenticacao segura e todos os depositos e saques sao via PIX, garantindo total rastreabilidade. Seus dados sao protegidos e nunca compartilhados com terceiros.'
  },
  {
    keywords: ['horario','funcionamento','quando operar','24 horas','aberto'],
    q: 'Qual o horario de funcionamento?',
    a: 'A plataforma esta disponivel 24 horas por dia, 7 dias por semana. Os ativos de criptomoedas funcionam sem interrupcao.'
  },
  {
    keywords: ['tempo','expiracao','duracao','tempo da operacao','quanto tempo'],
    q: 'Quais tempos de expiracao estao disponiveis?',
    a: 'Oferecemos operacoes com tempos de 30 segundos, 1 minuto, 5 minutos, 15 minutos e 30 minutos. Escolha o tempo que melhor se adapta a sua estrategia.'
  },
  {
    keywords: ['ativo','ativos','moeda','crypto','criptomoeda','bitcoin','ethereum','quais ativos','par'],
    q: 'Quais ativos posso operar?',
    a: 'Operamos com criptomoedas: BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, LTC/USDT, ADA/USDT, XRP/USDT, AVAX/USDT, DOGE/USDT, SUI/USDT, LINK/USDT e XLM/USDT. Todos com cotacao em tempo real via Binance.'
  },
  {
    keywords: ['demora','pendente','processando','nao caiu','cade','atrasado','deposito nao caiu','saque pendente'],
    q: 'Meu deposito ou saque esta demorando, o que faco?',
    a: 'Depositos via PIX sao creditados automaticamente em ate 2 minutos. Se nao apareceu, verifique se o pagamento foi confirmado no seu banco. Para saques, o prazo e de ate 24 horas uteis. Se ultrapassar esse prazo, entre em contato informando seu e-mail e ID de usuario.'
  },
  {
    keywords: ['saldo','balance','meu saldo','quanto tenho','ver saldo'],
    q: 'Onde vejo meu saldo?',
    a: 'Seu saldo aparece no topo da plataforma de trading. Voce tem dois saldos: conta real (depositos e lucros) e conta demo (R$ 10.000 virtuais para praticar sem risco).'
  },
  {
    keywords: ['demo','conta demo','treinar','praticar','simulador','conta virtual'],
    q: 'Como funciona a conta demo?',
    a: 'A conta demo vem com R$ 10.000,00 virtuais para voce praticar sem risco. E identica a conta real, mas sem dinheiro de verdade. Ideal para aprender a operar antes de depositar.'
  },
  {
    keywords: ['taxa','taxas','cobranca','comissao','custo'],
    q: 'Existem taxas na plataforma?',
    a: 'Nao cobramos taxas para depositos. Para saques, pode haver uma pequena taxa de processamento. O valor e informado antes de voce confirmar a solicitacao.'
  }
];

function searchFaq(message) {
  var msg = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  var bestMatch = null, bestScore = 0;
  for (var i = 0; i < FAQ.length; i++) {
    var score = 0;
    for (var j = 0; j < FAQ[i].keywords.length; j++) {
      if (msg.includes(FAQ[i].keywords[j].normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) score++;
    }
    if (score > bestScore) { bestScore = score; bestMatch = FAQ[i]; }
  }
  return bestScore > 0 ? bestMatch : null;
}

const SYSTEM_PROMPT = `Voce e a assistente virtual da HudBroker, uma plataforma de trading de criptomoedas com operacoes binarias.
Seu nome e Hud IA. Seja simpatica, profissional e objetiva.

REGRAS:
- Responda APENAS sobre assuntos da HudBroker e da plataforma de trading.
- Se a pergunta nao for sobre a corretora, diga educadamente que so pode ajudar com assuntos da HudBroker.
- Portugues brasileiro informal mas profissional. Respostas curtas (maximo 2-3 paragrafos).
- Nao invente informacoes. Se nao souber, oriente o cliente a clicar em "Falar com humano" no chat.
- NUNCA forneca dados pessoais de outros clientes.
- NUNCA fale sobre programa de afiliados, comissoes ou indicacoes.

INFORMACOES REAIS DA PLATAFORMA:
- Deposito minimo: R$ 75,00 exclusivamente via PIX (credito instantaneo)
- Saque minimo: R$ 150,00 via PIX (prazo ate 24h uteis)
- Verificacao KYC obrigatoria para saques (documento + selfie, analise em ate 48h)
- Payout padrao: 85% de lucro por operacao
- Tempos de expiracao: 30s, 1min, 5min, 15min, 30min
- Ativos disponiveis: BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, LTC/USDT, ADA/USDT, XRP/USDT, AVAX/USDT, DOGE/USDT, SUI/USDT, LINK/USDT, XLM/USDT
- Cotacoes em tempo real via Binance WebSocket
- Conta demo com R$ 10.000 virtuais para praticar
- Plataforma 24/7
- Suporte via chat na plataforma`;

// WebSocket maps (mantidos para compatibilidade, mas polling e o principal)
export const supportClients = new Map();
export const agentSockets = new Set();
export function broadcastToConversation() {}
export function notifyAgents() {}

// ─── POST /api/support/start ───
router.post('/start', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email obrigatorio' });

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
    await run(`INSERT INTO support_conversations (id, client_email, status) VALUES ($1, $2, 'bot')`, [id, email]);
    const conv = await queryOne(`SELECT * FROM support_conversations WHERE id = $1`, [id]);
    return res.json({ conversation: conv, messages: [] });
  } catch (err) {
    console.error('[support/start]', err);
    return res.status(500).json({ error: 'Erro ao iniciar conversa' });
  }
});

// ─── POST /api/support/chat ───
router.post('/chat', async (req, res) => {
  try {
    const { email, message, conversationId, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Mensagem obrigatoria' });

    if (conversationId) {
      const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
      await run(`INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'client', $3)`, [msgId, conversationId, message]);
      await run(`UPDATE support_conversations SET updated_at = now() WHERE id = $1`, [conversationId]);

      const conv = await queryOne(`SELECT status FROM support_conversations WHERE id = $1`, [conversationId]);
      if (conv && (conv.status === 'active' || conv.status === 'waiting')) {
        return res.json({ reply: null, source: 'human', status: conv.status });
      }
    }

    const faqMatch = searchFaq(message);
    if (faqMatch && history.length <= 2) {
      const reply = faqMatch.a;
      if (conversationId) {
        const rId = 'msg_' + crypto.randomBytes(8).toString('hex');
        await run(`INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'bot', $3)`, [rId, conversationId, reply]);
      }
      return res.json({ reply, source: 'faq', faqQuestion: faqMatch.q });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const reply = faqMatch ? faqMatch.a : 'No momento nao consegui encontrar uma resposta para sua duvida. Clique em "Falar com humano" para ser atendido por nossa equipe.';
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
    return res.json({ reply: 'Desculpe, tive um problema tecnico. Clique em "Falar com humano" para ser atendido.', source: 'error' });
  }
});

// ─── POST /api/support/request-human ───
router.post('/request-human', async (req, res) => {
  try {
    const { conversationId } = req.body;
    if (!conversationId) return res.status(400).json({ error: 'conversationId obrigatorio' });

    await run(`UPDATE support_conversations SET status = 'waiting', updated_at = now() WHERE id = $1`, [conversationId]);
    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await run(`INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'system', $3)`,
      [msgId, conversationId, 'Voce sera atendido por um de nossos atendentes em breve. Aguarde...']);

    return res.json({ ok: true, message: 'Solicitacao enviada! Um atendente vai te atender em breve.' });
  } catch (err) {
    console.error('[support/request-human]', err);
    return res.status(500).json({ error: 'Erro ao solicitar atendente' });
  }
});

// ─── GET /api/support/conversations ───
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
    return res.status(500).json({ error: 'Erro ao listar conversas' });
  }
});

// ─── GET /api/support/conversations/:id/messages ───
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await query(`SELECT * FROM support_messages WHERE conversation_id = $1 ORDER BY created_at ASC`, [req.params.id]);
    const conv = await queryOne(`SELECT * FROM support_conversations WHERE id = $1`, [req.params.id]);
    return res.json({ conversation: conv, messages });
  } catch (err) {
    return res.status(500).json({ error: 'Erro' });
  }
});

// ─── POST /api/support/conversations/:id/reply ───
router.post('/conversations/:id/reply', async (req, res) => {
  try {
    const { content, agentName = 'Atendente' } = req.body;
    const convId = req.params.id;
    if (!content) return res.status(400).json({ error: 'Conteudo obrigatorio' });

    const conv = await queryOne(`SELECT status FROM support_conversations WHERE id = $1`, [convId]);
    if (conv && conv.status === 'waiting') {
      await run(`UPDATE support_conversations SET status = 'active', assigned_agent = $1, updated_at = now() WHERE id = $2`, [agentName, convId]);
    } else {
      await run(`UPDATE support_conversations SET updated_at = now() WHERE id = $1`, [convId]);
    }

    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await run(`INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'agent', $3)`, [msgId, convId, content]);

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// ─── POST /api/support/conversations/:id/close ───
router.post('/conversations/:id/close', async (req, res) => {
  try {
    await run(`UPDATE support_conversations SET status = 'closed', updated_at = now() WHERE id = $1`, [req.params.id]);
    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await run(`INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'system', $3)`,
      [msgId, req.params.id, 'Atendimento encerrado. Se precisar de mais ajuda, e so abrir o suporte novamente!']);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao fechar conversa' });
  }
});

// ─── POST /api/support/conversations/:id/transfer ───
router.post('/conversations/:id/transfer', async (req, res) => {
  try {
    const { sector = 'financeiro' } = req.body;
    const convId = req.params.id;

    await run(`UPDATE support_conversations SET assigned_agent = $1, updated_at = now() WHERE id = $2`, ['Setor: ' + sector, convId]);
    const msgId = 'msg_' + crypto.randomBytes(8).toString('hex');
    await run(`INSERT INTO support_messages (id, conversation_id, sender, content) VALUES ($1, $2, 'system', $3)`,
      [msgId, convId, 'Voce foi transferido para o setor ' + sector + '. Um especialista vai te atender em breve.']);

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao transferir' });
  }
});

router.get('/faq', (req, res) => res.json(FAQ.map(f => ({ q: f.q, a: f.a }))));

export default router;
