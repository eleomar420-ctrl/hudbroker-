import { Router } from 'express';

const router = Router();

// ─── Base de conhecimento (FAQ) ───
const FAQ = [
  {
    keywords: ['depositar', 'depósito', 'deposito', 'adicionar saldo', 'colocar dinheiro'],
    q: 'Como faço para depositar?',
    a: 'Para depositar, acesse sua conta e clique no botão "Depositar". Aceitamos depósitos via PIX — o valor mínimo é de R$ 30,00. O crédito é instantâneo após a confirmação do pagamento.'
  },
  {
    keywords: ['sacar', 'saque', 'retirar', 'retirada', 'tirar dinheiro'],
    q: 'Como faço para sacar?',
    a: 'Acesse o menu e clique em "Sacar". Informe o valor e sua chave PIX. O saque mínimo é de R$ 50,00. O prazo de processamento é de até 24 horas úteis, mas na maioria dos casos é concluído em minutos.'
  },
  {
    keywords: ['pix', 'chave pix', 'pagamento pix'],
    q: 'Quais tipos de chave PIX são aceitos?',
    a: 'Aceitamos todas as chaves PIX: CPF, e-mail, telefone e chave aleatória. Certifique-se de que a chave informada está correta para evitar atrasos no saque.'
  },
  {
    keywords: ['operar', 'trade', 'trading', 'operação', 'abrir operação', 'como operar', 'comprar', 'vender'],
    q: 'Como faço para operar na plataforma?',
    a: 'Após fazer login e ter saldo, acesse a tela de trading. Escolha o ativo (ex: EUR/USD), defina o valor da operação, selecione o tempo de expiração e clique em "Comprar" (se acredita que vai subir) ou "Vender" (se acredita que vai cair). Ao final do tempo, se sua previsão estiver correta, você recebe o lucro.'
  },
  {
    keywords: ['lucro', 'ganho', 'rendimento', 'payout', 'quanto ganho', 'porcentagem'],
    q: 'Qual é a porcentagem de lucro por operação?',
    a: 'A porcentagem de lucro (payout) varia de acordo com o ativo e o horário do mercado, podendo chegar até 95%. O valor exato é exibido na tela de operação antes de você confirmar.'
  },
  {
    keywords: ['verificar', 'verificação', 'documento', 'identidade', 'kyc', 'selfie', 'comprovar'],
    q: 'Preciso verificar minha conta?',
    a: 'Sim, para realizar saques é necessário verificar sua identidade. Acesse "Minha Conta" > "Verificação" e envie uma foto do seu documento (RG ou CNH) e uma selfie. A análise leva até 48 horas.'
  },
  {
    keywords: ['afiliado', 'afiliados', 'indicação', 'indicar', 'comissão', 'link de afiliado', 'parceiro'],
    q: 'Como funciona o programa de afiliados?',
    a: 'Você pode indicar amigos e ganhar comissão sobre as operações deles. Acesse o painel de afiliados para obter seu link exclusivo. As comissões são calculadas automaticamente e você pode sacá-las a qualquer momento.'
  },
  {
    keywords: ['conta', 'cadastro', 'registrar', 'criar conta', 'abrir conta'],
    q: 'Como crio minha conta?',
    a: 'Clique em "Criar Conta" na página inicial, preencha seu nome, e-mail e senha. Você receberá um e-mail de confirmação. Após confirmar, sua conta estará pronta para uso.'
  },
  {
    keywords: ['senha', 'esqueci', 'redefinir', 'trocar senha', 'recuperar'],
    q: 'Esqueci minha senha, o que faço?',
    a: 'Na tela de login, clique em "Esqueci minha senha". Informe o e-mail cadastrado e enviaremos um link para redefinição. Verifique também a caixa de spam.'
  },
  {
    keywords: ['mínimo', 'valor mínimo', 'mínimo depósito', 'mínimo saque', 'mínimo operação'],
    q: 'Quais são os valores mínimos?',
    a: 'Depósito mínimo: R$ 30,00. Saque mínimo: R$ 50,00. Operação mínima: R$ 5,00. Esses valores garantem uma boa experiência na plataforma.'
  },
  {
    keywords: ['seguro', 'segurança', 'confiável', 'golpe', 'fraude', 'regulamentação'],
    q: 'A HudBroker é segura?',
    a: 'Sim! A HudBroker utiliza criptografia de ponta a ponta, autenticação segura com JWT e conexões HTTPS. Seus dados e fundos estão protegidos. Além disso, todos os depósitos e saques são processados via PIX, garantindo rastreabilidade.'
  },
  {
    keywords: ['horário', 'funcionamento', 'mercado aberto', 'quando operar', 'horario'],
    q: 'Qual o horário de funcionamento?',
    a: 'A plataforma está disponível 24 horas por dia, 7 dias por semana. Alguns ativos podem ter horários específicos de maior liquidez, mas você pode operar a qualquer momento.'
  },
  {
    keywords: ['tempo', 'expiração', 'duração', 'tempo da operação'],
    q: 'Quais tempos de expiração estão disponíveis?',
    a: 'Oferecemos operações de 30 segundos, 1 minuto, 5 minutos, 15 minutos e 30 minutos. Escolha o tempo que melhor se adapta à sua estratégia.'
  },
  {
    keywords: ['ativo', 'ativos', 'par', 'moeda', 'crypto', 'criptomoeda', 'bitcoin', 'eur', 'usd'],
    q: 'Quais ativos posso operar?',
    a: 'Disponibilizamos pares de moedas (EUR/USD, GBP/USD, etc.), criptomoedas (BTC/USD, ETH/USD) e outros ativos. A lista completa está disponível na tela de trading.'
  },
  {
    keywords: ['demora', 'pendente', 'processando', 'não caiu', 'cadê', 'atrasado'],
    q: 'Meu depósito/saque está demorando, o que faço?',
    a: 'Depósitos via PIX são normalmente instantâneos. Se não foi creditado em até 10 minutos, entre em contato conosco informando o comprovante. Para saques, o prazo é de até 24 horas úteis. Se ultrapassar esse prazo, fale conosco com seu e-mail e ID de usuário.'
  }
];

// ─── Buscar na FAQ ───
function searchFaq(message) {
  const msg = message.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  let bestMatch = null;
  let bestScore = 0;

  for (const item of FAQ) {
    let score = 0;
    for (const kw of item.keywords) {
      const kwNorm = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (msg.includes(kwNorm)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = item;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

// ─── System prompt para o Claude ───
const SYSTEM_PROMPT = `Você é a assistente virtual da HudBroker, uma corretora de operações binárias (trading).
Seu nome é Hud IA. Seja simpática, profissional e objetiva.

REGRAS:
- Responda APENAS sobre assuntos relacionados à HudBroker e trading.
- Se a pergunta não for sobre a corretora, diga educadamente que só pode ajudar com assuntos da HudBroker.
- Use português brasileiro informal mas profissional.
- Respostas curtas e diretas (máximo 3 parágrafos).
- Não invente informações. Se não souber, oriente o cliente a entrar em contato com support@hudbroker.com.
- NUNCA forneça dados pessoais de outros clientes.

INFORMAÇÕES DA PLATAFORMA:
- Depósito mínimo: R$ 30,00 via PIX
- Saque mínimo: R$ 50,00 via PIX (prazo até 24h úteis)
- Operação mínima: R$ 5,00
- Payout: até 95% dependendo do ativo
- Ativos: pares de moedas (EUR/USD, GBP/USD, etc.) e criptomoedas (BTC/USD, ETH/USD)
- Tempos de expiração: 30s, 1min, 5min, 15min, 30min
- Plataforma 24/7
- Verificação KYC necessária para saques (documento + selfie)
- Programa de afiliados com comissões sobre operações dos indicados
- Suporte por email: support@hudbroker.com`;

// ─── POST /api/support/chat ───
router.post('/chat', async (req, res) => {
  try {
    const { email, message, history = [] } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: 'Email e mensagem são obrigatórios.' });
    }

    // 1) Tentar FAQ primeiro
    const faqMatch = searchFaq(message);
    if (faqMatch && history.length <= 2) {
      return res.json({
        reply: faqMatch.a,
        source: 'faq',
        faqQuestion: faqMatch.q
      });
    }

    // 2) Chamar Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      // Fallback se não tiver API key configurada
      if (faqMatch) {
        return res.json({ reply: faqMatch.a, source: 'faq', faqQuestion: faqMatch.q });
      }
      return res.json({
        reply: 'No momento, nosso atendimento inteligente está em manutenção. Por favor, envie sua dúvida para support@hudbroker.com e responderemos o mais breve possível!',
        source: 'fallback'
      });
    }

    // Montar histórico para o Claude
    const messages = [];
    for (const h of history.slice(-10)) {
      messages.push({ role: h.role, content: h.content });
    }
    messages.push({ role: 'user', content: `[Cliente: ${email}]\n${message}` });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages
      })
    });

    if (!response.ok) {
      // Fallback para FAQ se API falhar
      if (faqMatch) {
        return res.json({ reply: faqMatch.a, source: 'faq', faqQuestion: faqMatch.q });
      }
      throw new Error(`API retornou ${response.status}`);
    }

    const data = await response.json();
    const reply = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    return res.json({ reply, source: 'ai' });

  } catch (err) {
    console.error('[support] Erro:', err.message);
    return res.json({
      reply: 'Desculpe, tive um problema técnico. Tente novamente ou envie sua dúvida para support@hudbroker.com.',
      source: 'error'
    });
  }
});

// ─── GET /api/support/faq ───
router.get('/faq', (req, res) => {
  res.json(FAQ.map(f => ({ q: f.q, a: f.a })));
});

export default router;
