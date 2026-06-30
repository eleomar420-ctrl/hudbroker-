/* ═══════════════════════════════════════════════
   HudBroker – Suporte IA Chat Widget
   ═══════════════════════════════════════════════ */
(function () {
  if (window.__hudSupportLoaded) return;
  window.__hudSupportLoaded = true;

  // ─── Quick FAQs exibidas como botões ───
  const QUICK_FAQS = [
    'Como faço para depositar?',
    'Como faço para sacar?',
    'Como operar na plataforma?',
    'Quais são os valores mínimos?',
    'Preciso verificar minha conta?',
    'Como funciona o programa de afiliados?',
    'Meu depósito está demorando'
  ];

  // ─── Injetar CSS ───
  const style = document.createElement('style');
  style.textContent = `
    /* Floating Button */
    .hud-support-fab {
      position: fixed; bottom: 24px; right: 24px; z-index: 99998;
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #e8a23d, #d4891e);
      border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(232,162,61,0.4);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .hud-support-fab:hover { transform: scale(1.1); box-shadow: 0 6px 28px rgba(232,162,61,0.5); }
    .hud-support-fab svg { width: 26px; height: 26px; fill: #000; }
    .hud-support-fab .hud-fab-badge {
      position: absolute; top: -2px; right: -2px;
      width: 14px; height: 14px; border-radius: 50%;
      background: #08B774; border: 2px solid #000;
    }

    /* Chat Panel */
    .hud-support-panel {
      position: fixed; bottom: 92px; right: 24px; z-index: 99999;
      width: 380px; max-height: 560px; border-radius: 16px;
      background: #0d0d0d; border: 1px solid #232323;
      box-shadow: 0 12px 48px rgba(0,0,0,0.6);
      display: none; flex-direction: column;
      font-family: 'Inter', sans-serif; overflow: hidden;
      animation: hudSlideUp 0.25s ease-out;
    }
    .hud-support-panel.open { display: flex; }
    @keyframes hudSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Header */
    .hud-chat-header {
      padding: 16px 20px; display: flex; align-items: center; gap: 12px;
      border-bottom: 1px solid #232323; background: #0d0d0d;
    }
    .hud-chat-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: linear-gradient(135deg, #e8a23d, #d4891e);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 15px; color: #000;
      flex-shrink: 0;
    }
    .hud-chat-header-info { flex: 1; }
    .hud-chat-header-name { font-weight: 600; font-size: 14px; color: #e8eaed; }
    .hud-chat-header-status { font-size: 11px; color: #08B774; display: flex; align-items: center; gap: 4px; }
    .hud-chat-header-status::before {
      content: ''; width: 6px; height: 6px; border-radius: 50%; background: #08B774;
    }
    .hud-chat-close {
      background: none; border: none; color: #8b92a3; cursor: pointer;
      font-size: 20px; padding: 4px; line-height: 1; border-radius: 6px;
    }
    .hud-chat-close:hover { background: #161616; color: #e8eaed; }

    /* Email Screen */
    .hud-email-screen {
      padding: 32px 24px; text-align: center; flex: 1;
      display: flex; flex-direction: column; justify-content: center; gap: 16px;
    }
    .hud-email-screen h3 {
      color: #e8eaed; font-size: 16px; font-weight: 600; margin: 0;
      font-family: 'Space Grotesk', sans-serif;
    }
    .hud-email-screen p { color: #8b92a3; font-size: 13px; margin: 0; line-height: 1.5; }
    .hud-email-input {
      width: 100%; padding: 12px 14px; border-radius: 10px;
      border: 1px solid #232323; background: #161616; color: #e8eaed;
      font-size: 14px; font-family: 'Inter', sans-serif; outline: none;
      transition: border-color 0.2s;
    }
    .hud-email-input:focus { border-color: #e8a23d; }
    .hud-email-input::placeholder { color: #5a6178; }
    .hud-email-submit {
      width: 100%; padding: 12px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #e8a23d, #d4891e);
      color: #000; font-weight: 600; font-size: 14px; cursor: pointer;
      font-family: 'Inter', sans-serif; transition: opacity 0.2s;
    }
    .hud-email-submit:hover { opacity: 0.9; }
    .hud-email-submit:disabled { opacity: 0.5; cursor: not-allowed; }
    .hud-email-error { color: #F92757; font-size: 12px; margin: 0; }

    /* Chat Body */
    .hud-chat-body {
      flex: 1; overflow-y: auto; padding: 16px 16px 8px;
      display: flex; flex-direction: column; gap: 10px;
      max-height: 340px; min-height: 200px;
      scrollbar-width: thin; scrollbar-color: #232323 transparent;
    }
    .hud-chat-body::-webkit-scrollbar { width: 4px; }
    .hud-chat-body::-webkit-scrollbar-thumb { background: #232323; border-radius: 4px; }

    /* Messages */
    .hud-msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.55; word-wrap: break-word; }
    .hud-msg-bot {
      align-self: flex-start; background: #161616; color: #e8eaed;
      border-bottom-left-radius: 4px;
    }
    .hud-msg-user {
      align-self: flex-end; background: #e8a23d; color: #000;
      border-bottom-right-radius: 4px;
    }
    .hud-msg-typing {
      align-self: flex-start; background: #161616; padding: 12px 18px;
      border-radius: 12px; border-bottom-left-radius: 4px;
      display: flex; gap: 5px; align-items: center;
    }
    .hud-msg-typing span {
      width: 7px; height: 7px; border-radius: 50%; background: #8b92a3;
      animation: hudBounce 1.4s infinite;
    }
    .hud-msg-typing span:nth-child(2) { animation-delay: 0.2s; }
    .hud-msg-typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes hudBounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    /* Quick FAQs */
    .hud-quick-faqs { padding: 0 16px 8px; display: flex; flex-wrap: wrap; gap: 6px; }
    .hud-quick-faq-btn {
      padding: 6px 12px; border-radius: 20px; font-size: 11px;
      border: 1px solid #232323; background: #161616; color: #8b92a3;
      cursor: pointer; transition: all 0.15s; font-family: 'Inter', sans-serif;
    }
    .hud-quick-faq-btn:hover { border-color: #e8a23d; color: #e8a23d; }

    /* Input Area */
    .hud-chat-footer {
      padding: 12px 16px; border-top: 1px solid #232323;
      display: flex; gap: 8px; align-items: center;
    }
    .hud-chat-input {
      flex: 1; padding: 10px 14px; border-radius: 10px;
      border: 1px solid #232323; background: #161616; color: #e8eaed;
      font-size: 13px; font-family: 'Inter', sans-serif; outline: none;
      resize: none; max-height: 80px; min-height: 40px;
    }
    .hud-chat-input:focus { border-color: #e8a23d; }
    .hud-chat-input::placeholder { color: #5a6178; }
    .hud-chat-send {
      width: 38px; height: 38px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #e8a23d, #d4891e);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: opacity 0.2s; flex-shrink: 0;
    }
    .hud-chat-send:hover { opacity: 0.85; }
    .hud-chat-send:disabled { opacity: 0.4; cursor: not-allowed; }
    .hud-chat-send svg { width: 18px; height: 18px; fill: #000; }

    /* Powered By */
    .hud-powered { text-align: center; padding: 6px; font-size: 10px; color: #5a6178; }

    /* Mobile */
    @media (max-width: 480px) {
      .hud-support-panel {
        bottom: 0; right: 0; left: 0; width: 100%;
        max-height: 100vh; border-radius: 16px 16px 0 0;
      }
      .hud-support-fab { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ─── Criar DOM ───
  const fab = document.createElement('button');
  fab.className = 'hud-support-fab';
  fab.title = 'Suporte';
  fab.innerHTML = `
    <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg>
    <div class="hud-fab-badge"></div>
  `;
  document.body.appendChild(fab);

  const panel = document.createElement('div');
  panel.className = 'hud-support-panel';
  panel.innerHTML = `
    <div class="hud-chat-header">
      <div class="hud-chat-avatar">IA</div>
      <div class="hud-chat-header-info">
        <div class="hud-chat-header-name">Hud IA · Suporte</div>
        <div class="hud-chat-header-status">Online agora</div>
      </div>
      <button class="hud-chat-close">&times;</button>
    </div>

    <!-- Email Screen -->
    <div class="hud-email-screen" id="hudEmailScreen">
      <h3>Bem-vindo ao suporte!</h3>
      <p>Para iniciar o atendimento, informe o e-mail cadastrado na sua conta HudBroker.</p>
      <input type="email" class="hud-email-input" id="hudEmailInput" placeholder="seu@email.com">
      <p class="hud-email-error" id="hudEmailError" style="display:none"></p>
      <button class="hud-email-submit" id="hudEmailSubmit">Iniciar atendimento</button>
    </div>

    <!-- Chat Screen (hidden initially) -->
    <div id="hudChatScreen" style="display:none; flex:1; flex-direction:column;">
      <div class="hud-chat-body" id="hudChatBody"></div>
      <div class="hud-quick-faqs" id="hudQuickFaqs"></div>
      <div class="hud-chat-footer">
        <textarea class="hud-chat-input" id="hudChatInput" placeholder="Digite sua dúvida..." rows="1"></textarea>
        <button class="hud-chat-send" id="hudChatSend">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
      <div class="hud-powered">Hud IA · Atendimento inteligente</div>
    </div>
  `;
  document.body.appendChild(panel);

  // ─── Referências ───
  const emailScreen = document.getElementById('hudEmailScreen');
  const chatScreen = document.getElementById('hudChatScreen');
  const emailInput = document.getElementById('hudEmailInput');
  const emailError = document.getElementById('hudEmailError');
  const emailSubmit = document.getElementById('hudEmailSubmit');
  const chatBody = document.getElementById('hudChatBody');
  const quickFaqs = document.getElementById('hudQuickFaqs');
  const chatInput = document.getElementById('hudChatInput');
  const chatSend = document.getElementById('hudChatSend');
  const closeBtn = panel.querySelector('.hud-chat-close');

  let userEmail = '';
  let chatHistory = [];
  let isLoading = false;

  // ─── Toggle Panel ───
  function togglePanel() {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !userEmail) {
      emailInput.focus();
    } else if (panel.classList.contains('open') && userEmail) {
      chatInput.focus();
    }
  }

  fab.addEventListener('click', togglePanel);
  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  // ─── Função global para abrir o chat ───
  window.openSupportChat = function () {
    if (!panel.classList.contains('open')) togglePanel();
  };

  // ─── Validar e-mail ───
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ─── Iniciar chat ───
  emailSubmit.addEventListener('click', startChat);
  emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') startChat(); });

  function startChat() {
    const email = emailInput.value.trim();
    if (!validateEmail(email)) {
      emailError.textContent = 'Por favor, informe um e-mail válido.';
      emailError.style.display = 'block';
      return;
    }
    userEmail = email;
    emailError.style.display = 'none';
    emailScreen.style.display = 'none';
    chatScreen.style.display = 'flex';

    // Mensagem de boas-vindas
    addMessage('bot', `Olá! Sou a Hud IA, sua assistente virtual. 😊\n\nVi que você está logado como ${email}. Como posso te ajudar hoje?\n\nVocê pode digitar sua dúvida ou clicar em uma das perguntas rápidas abaixo.`);

    // Renderizar FAQs rápidas
    renderQuickFaqs();
    chatInput.focus();
  }

  // ─── Quick FAQs ───
  function renderQuickFaqs() {
    quickFaqs.innerHTML = '';
    QUICK_FAQS.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'hud-quick-faq-btn';
      btn.textContent = q;
      btn.addEventListener('click', () => {
        sendMessage(q);
        quickFaqs.innerHTML = '';
      });
      quickFaqs.appendChild(btn);
    });
  }

  // ─── Adicionar mensagem ao chat ───
  function addMessage(type, text) {
    const div = document.createElement('div');
    div.className = `hud-msg hud-msg-${type}`;
    div.textContent = text;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'hud-msg-typing';
    div.id = 'hudTyping';
    div.innerHTML = '<span></span><span></span><span></span>';
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('hudTyping');
    if (t) t.remove();
  }

  // ─── Enviar mensagem ───
  async function sendMessage(text) {
    if (!text || !text.trim() || isLoading) return;
    const msg = text.trim();

    addMessage('user', msg);
    chatHistory.push({ role: 'user', content: msg });
    chatInput.value = '';
    chatInput.style.height = 'auto';
    isLoading = true;
    chatSend.disabled = true;
    showTyping();

    try {
      const resp = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          message: msg,
          history: chatHistory
        })
      });
      const data = await resp.json();
      hideTyping();

      const reply = data.reply || 'Desculpe, não consegui processar sua mensagem. Tente novamente.';
      addMessage('bot', reply);
      chatHistory.push({ role: 'assistant', content: reply });

    } catch (err) {
      hideTyping();
      addMessage('bot', 'Ops, houve um erro de conexão. Tente novamente em instantes.');
    }

    isLoading = false;
    chatSend.disabled = false;
    chatInput.focus();
  }

  // ─── Eventos de input ───
  chatSend.addEventListener('click', () => sendMessage(chatInput.value));
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput.value);
    }
  });

  // Auto-resize textarea
  chatInput.addEventListener('input', () => {
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 80) + 'px';
  });

})();
