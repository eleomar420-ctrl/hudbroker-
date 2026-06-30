(function(){
try{
if(window.__hudSupportLoaded)return;
window.__hudSupportLoaded=true;

var QUICK_FAQS=[
'Como depositar?',
'Como sacar?',
'Como operar?',
'Valores minimos?',
'Verificar minha conta?',
'Programa de afiliados?',
'Deposito demorando'
];

var style=document.createElement('style');
style.textContent='.hud-support-fab{position:fixed;bottom:24px;right:24px;z-index:99998;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#e8a23d,#d4891e);border:none;cursor:pointer;box-shadow:0 4px 20px rgba(232,162,61,0.4);display:flex;align-items:center;justify-content:center;transition:transform 0.2s,box-shadow 0.2s;}.hud-support-fab:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(232,162,61,0.5);}.hud-support-fab svg{width:26px;height:26px;fill:#000;}.hud-support-fab .hud-fab-badge{position:absolute;top:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:#08B774;border:2px solid #000;}.hud-support-panel{position:fixed;bottom:92px;right:24px;z-index:99999;width:380px;max-height:560px;border-radius:16px;background:#0d0d0d;border:1px solid #232323;box-shadow:0 12px 48px rgba(0,0,0,0.6);display:none;flex-direction:column;font-family:Inter,sans-serif;overflow:hidden;animation:hudSlideUp 0.25s ease-out;}.hud-support-panel.open{display:flex;}@keyframes hudSlideUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}.hud-chat-header{padding:16px 20px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #232323;background:#0d0d0d;}.hud-chat-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#e8a23d,#d4891e);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:#000;flex-shrink:0;}.hud-chat-header-info{flex:1;}.hud-chat-header-name{font-weight:600;font-size:14px;color:#e8eaed;}.hud-chat-header-status{font-size:11px;color:#08B774;display:flex;align-items:center;gap:4px;}.hud-chat-header-status::before{content:"";width:6px;height:6px;border-radius:50%;background:#08B774;}.hud-chat-close{background:none;border:none;color:#8b92a3;cursor:pointer;font-size:20px;padding:4px;line-height:1;border-radius:6px;}.hud-chat-close:hover{background:#161616;color:#e8eaed;}.hud-email-screen{padding:32px 24px;text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;gap:16px;}.hud-email-screen h3{color:#e8eaed;font-size:16px;font-weight:600;margin:0;font-family:"Space Grotesk",sans-serif;}.hud-email-screen p{color:#8b92a3;font-size:13px;margin:0;line-height:1.5;}.hud-email-input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid #232323;background:#161616;color:#e8eaed;font-size:14px;font-family:Inter,sans-serif;outline:none;transition:border-color 0.2s;}.hud-email-input:focus{border-color:#e8a23d;}.hud-email-input::placeholder{color:#5a6178;}.hud-email-submit{width:100%;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#e8a23d,#d4891e);color:#000;font-weight:600;font-size:14px;cursor:pointer;font-family:Inter,sans-serif;transition:opacity 0.2s;}.hud-email-submit:hover{opacity:0.9;}.hud-email-submit:disabled{opacity:0.5;cursor:not-allowed;}.hud-email-error{color:#F92757;font-size:12px;margin:0;}.hud-chat-body{flex:1;overflow-y:auto;padding:16px 16px 8px;display:flex;flex-direction:column;gap:10px;max-height:300px;min-height:180px;scrollbar-width:thin;scrollbar-color:#232323 transparent;}.hud-chat-body::-webkit-scrollbar{width:4px;}.hud-chat-body::-webkit-scrollbar-thumb{background:#232323;border-radius:4px;}.hud-msg{max-width:85%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.55;word-wrap:break-word;}.hud-msg-bot{align-self:flex-start;background:#161616;color:#e8eaed;border-bottom-left-radius:4px;}.hud-msg-agent{align-self:flex-start;background:#1a2332;color:#e8eaed;border-bottom-left-radius:4px;border-left:2px solid #08B774;}.hud-msg-user{align-self:flex-end;background:#e8a23d;color:#000;border-bottom-right-radius:4px;}.hud-msg-system{align-self:center;background:transparent;color:#8b92a3;font-size:11px;text-align:center;padding:6px 12px;}.hud-msg-typing{align-self:flex-start;background:#161616;padding:12px 18px;border-radius:12px;border-bottom-left-radius:4px;display:flex;gap:5px;align-items:center;}.hud-msg-typing span{width:7px;height:7px;border-radius:50%;background:#8b92a3;animation:hudBounce 1.4s infinite;}.hud-msg-typing span:nth-child(2){animation-delay:0.2s;}.hud-msg-typing span:nth-child(3){animation-delay:0.4s;}@keyframes hudBounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}.hud-quick-faqs{padding:0 16px 8px;display:flex;flex-wrap:wrap;gap:6px;}.hud-quick-faq-btn{padding:6px 12px;border-radius:20px;font-size:11px;border:1px solid #232323;background:#161616;color:#8b92a3;cursor:pointer;transition:all 0.15s;font-family:Inter,sans-serif;}.hud-quick-faq-btn:hover{border-color:#e8a23d;color:#e8a23d;}.hud-human-bar{padding:8px 16px;display:flex;gap:8px;align-items:center;}.hud-human-btn{flex:1;padding:10px;border-radius:10px;border:1px solid #232323;background:#161616;color:#8b92a3;font-size:12px;cursor:pointer;font-family:Inter,sans-serif;transition:all 0.15s;display:flex;align-items:center;justify-content:center;gap:6px;}.hud-human-btn:hover{border-color:#08B774;color:#08B774;}.hud-human-btn.waiting{border-color:#e8a23d;color:#e8a23d;cursor:default;animation:hudPulse 2s infinite;}.hud-human-btn.active{border-color:#08B774;color:#08B774;cursor:default;}@keyframes hudPulse{0%,100%{opacity:1;}50%{opacity:0.6;}}.hud-chat-footer{padding:12px 16px;border-top:1px solid #232323;display:flex;gap:8px;align-items:center;}.hud-chat-input{flex:1;padding:10px 14px;border-radius:10px;border:1px solid #232323;background:#161616;color:#e8eaed;font-size:13px;font-family:Inter,sans-serif;outline:none;resize:none;max-height:80px;min-height:40px;}.hud-chat-input:focus{border-color:#e8a23d;}.hud-chat-input::placeholder{color:#5a6178;}.hud-chat-send{width:38px;height:38px;border-radius:10px;border:none;background:linear-gradient(135deg,#e8a23d,#d4891e);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:opacity 0.2s;flex-shrink:0;}.hud-chat-send:hover{opacity:0.85;}.hud-chat-send:disabled{opacity:0.4;cursor:not-allowed;}.hud-chat-send svg{width:18px;height:18px;fill:#000;}.hud-powered{text-align:center;padding:6px;font-size:10px;color:#5a6178;}@media(max-width:480px){.hud-support-panel{bottom:0;right:0;left:0;width:100%;max-height:100vh;border-radius:16px 16px 0 0;}.hud-support-fab{bottom:16px;right:16px;}}';
document.head.appendChild(style);

var fab=document.createElement('button');
fab.className='hud-support-fab';
fab.title='Suporte';
fab.innerHTML='<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/><path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/></svg><div class="hud-fab-badge"></div>';
document.body.appendChild(fab);

var panel=document.createElement('div');
panel.className='hud-support-panel';
panel.innerHTML='<div class="hud-chat-header"><div class="hud-chat-avatar">IA</div><div class="hud-chat-header-info"><div class="hud-chat-header-name" id="hudChatTitle">Hud IA - Suporte</div><div class="hud-chat-header-status" id="hudChatStatus">Online agora</div></div><button class="hud-chat-close" id="hudCloseBtn">&times;</button></div><div class="hud-email-screen" id="hudEmailScreen"><h3>Bem-vindo ao suporte!</h3><p>Para iniciar o atendimento, informe o e-mail cadastrado na sua conta HudBroker.</p><input type="email" class="hud-email-input" id="hudEmailInput" placeholder="seu@email.com"><p class="hud-email-error" id="hudEmailError" style="display:none"></p><button class="hud-email-submit" id="hudEmailSubmit">Iniciar atendimento</button></div><div id="hudChatScreen" style="display:none;flex:1;flex-direction:column;"><div class="hud-chat-body" id="hudChatBody"></div><div class="hud-quick-faqs" id="hudQuickFaqs"></div><div class="hud-human-bar" id="hudHumanBar"><button class="hud-human-btn" id="hudHumanBtn">Falar com humano</button></div><div class="hud-chat-footer"><textarea class="hud-chat-input" id="hudChatInput" placeholder="Digite sua duvida..." rows="1"></textarea><button class="hud-chat-send" id="hudChatSend"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div><div class="hud-powered">Hud IA - Atendimento inteligente</div></div>';
document.body.appendChild(panel);

var emailScreen=document.getElementById('hudEmailScreen');
var chatScreen=document.getElementById('hudChatScreen');
var emailInput=document.getElementById('hudEmailInput');
var emailError=document.getElementById('hudEmailError');
var emailSubmit=document.getElementById('hudEmailSubmit');
var chatBody=document.getElementById('hudChatBody');
var quickFaqs=document.getElementById('hudQuickFaqs');
var chatInput=document.getElementById('hudChatInput');
var chatSend=document.getElementById('hudChatSend');
var closeBtn=document.getElementById('hudCloseBtn');
var humanBtn=document.getElementById('hudHumanBtn');
var humanBar=document.getElementById('hudHumanBar');
var chatTitle=document.getElementById('hudChatTitle');
var chatStatusEl=document.getElementById('hudChatStatus');

var userEmail='';
var conversationId=null;
var chatHistory=[];
var isLoading=false;
var mode='bot';
var ws=null;

function togglePanel(){
  panel.classList.toggle('open');
  if(panel.classList.contains('open')){
    if(!userEmail)emailInput.focus();
    else chatInput.focus();
  }
}

fab.addEventListener('click',togglePanel);
closeBtn.addEventListener('click',function(){panel.classList.remove('open');});

window.openSupportChat=function(){
  if(!panel.classList.contains('open'))togglePanel();
};

function validateEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}

function connectWs(){
  if(ws)return;
  try{
    var proto=location.protocol==='https:'?'wss':'ws';
    ws=new WebSocket(proto+'://'+location.host+'/ws/support');
    ws.onopen=function(){
      ws.send(JSON.stringify({type:'register',role:'client',conversationId:conversationId}));
    };
    ws.onmessage=function(e){
      try{
        var data=JSON.parse(e.data);
        if(data.type==='message'&&data.sender==='agent'){
          hideTyping();
          addMessage('agent',data.content,data.agentName||'Atendente');
          if(mode!=='active')setMode('active');
        }
        if(data.type==='closed'){
          addMessage('system','Atendimento encerrado. Obrigado pelo contato!');
          setMode('closed');
        }
      }catch(err){}
    };
    ws.onclose=function(){ws=null;setTimeout(function(){if(conversationId&&mode!=='closed')connectWs();},5000);};
    ws.onerror=function(){};
  }catch(err){}
}

function setMode(m){
  mode=m;
  if(m==='bot'){
    chatTitle.textContent='Hud IA - Suporte';
    chatStatusEl.textContent='Online agora';
    humanBtn.className='hud-human-btn';
    humanBtn.textContent='Falar com humano';
    humanBar.style.display='flex';
  }else if(m==='waiting'){
    chatTitle.textContent='Aguardando atendente...';
    chatStatusEl.textContent='Voce esta na fila';
    humanBtn.className='hud-human-btn waiting';
    humanBtn.textContent='Aguardando atendente...';
    quickFaqs.innerHTML='';
  }else if(m==='active'){
    chatTitle.textContent='Atendente - Ao vivo';
    chatStatusEl.textContent='Conectado';
    humanBar.style.display='none';
    quickFaqs.innerHTML='';
  }else if(m==='closed'){
    chatTitle.textContent='Atendimento encerrado';
    chatStatusEl.textContent='Finalizado';
    humanBar.style.display='none';
    quickFaqs.innerHTML='';
  }
}

emailSubmit.addEventListener('click',startChat);
emailInput.addEventListener('keydown',function(e){if(e.key==='Enter')startChat();});

function startChat(){
  var email=emailInput.value.trim();
  if(!validateEmail(email)){
    emailError.textContent='Por favor, informe um e-mail valido.';
    emailError.style.display='block';
    return;
  }
  userEmail=email;
  emailError.style.display='none';
  emailScreen.style.display='none';
  chatScreen.style.display='flex';

  fetch('/api/support/start',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:email})
  }).then(function(r){return r.json();}).then(function(data){
    conversationId=data.conversation.id;
    setMode(data.conversation.status);
    if(data.messages&&data.messages.length>0){
      data.messages.forEach(function(m){
        addMessage(m.sender,m.content);
        if(m.sender==='client')chatHistory.push({role:'user',content:m.content});
        else chatHistory.push({role:'assistant',content:m.content});
      });
    }else{
      addMessage('bot','Ola! Sou a Hud IA, sua assistente virtual.\n\nComo posso te ajudar hoje?\n\nVoce pode digitar sua duvida ou clicar em uma das perguntas rapidas abaixo.');
    }
    if(mode==='bot')renderQuickFaqs();
    connectWs();
  }).catch(function(){
    addMessage('bot','Ola! Sou a Hud IA. Como posso te ajudar?');
    renderQuickFaqs();
  });
  chatInput.focus();
}

function renderQuickFaqs(){
  quickFaqs.innerHTML='';
  QUICK_FAQS.forEach(function(q){
    var btn=document.createElement('button');
    btn.className='hud-quick-faq-btn';
    btn.textContent=q;
    btn.addEventListener('click',function(){sendMessage(q);});
    quickFaqs.appendChild(btn);
  });
}

function addMessage(type,text,agentName){
  var div=document.createElement('div');
  div.className='hud-msg hud-msg-'+type;
  if(type==='agent'&&agentName){
    var label=document.createElement('div');
    label.style.cssText='font-size:10px;color:#08B774;margin-bottom:3px;font-weight:600;';
    label.textContent=agentName;
    div.appendChild(label);
    var span=document.createElement('span');
    span.textContent=text;
    div.appendChild(span);
  }else{
    div.textContent=text;
  }
  chatBody.appendChild(div);
  chatBody.scrollTop=chatBody.scrollHeight;
  return div;
}

function showTyping(){
  if(document.getElementById('hudTyping'))return;
  var div=document.createElement('div');
  div.className='hud-msg-typing';div.id='hudTyping';
  div.innerHTML='<span></span><span></span><span></span>';
  chatBody.appendChild(div);
  chatBody.scrollTop=chatBody.scrollHeight;
}
function hideTyping(){var t=document.getElementById('hudTyping');if(t)t.remove();}

function sendMessage(text){
  if(!text||!text.trim()||isLoading)return;
  var msg=text.trim();
  addMessage('user',msg);
  chatHistory.push({role:'user',content:msg});
  chatInput.value='';
  chatInput.style.height='auto';
  isLoading=true;
  chatSend.disabled=true;

  if(mode==='active'||mode==='waiting'){
    fetch('/api/support/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:userEmail,message:msg,conversationId:conversationId,history:chatHistory})
    }).catch(function(){});
    isLoading=false;
    chatSend.disabled=false;
    chatInput.focus();
    return;
  }

  showTyping();
  fetch('/api/support/chat',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({email:userEmail,message:msg,conversationId:conversationId,history:chatHistory})
  }).then(function(r){return r.json();}).then(function(data){
    hideTyping();
    var reply=data.reply||'Desculpe, nao consegui processar. Tente novamente.';
    addMessage('bot',reply);
    chatHistory.push({role:'assistant',content:reply});
    if(mode==='bot')renderQuickFaqs();
  }).catch(function(){
    hideTyping();
    addMessage('bot','Ops, erro de conexao. Tente novamente.');
  }).finally(function(){
    isLoading=false;
    chatSend.disabled=false;
    chatInput.focus();
  });
}

humanBtn.addEventListener('click',function(){
  if(mode!=='bot')return;
  setMode('waiting');
  addMessage('system','Solicitando atendente humano...');
  fetch('/api/support/request-human',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({conversationId:conversationId})
  }).then(function(r){return r.json();}).then(function(data){
    addMessage('system',data.message||'Aguardando atendente...');
  }).catch(function(){
    addMessage('system','Erro ao solicitar atendente. Tente novamente.');
    setMode('bot');
  });
});

chatSend.addEventListener('click',function(){sendMessage(chatInput.value);});
chatInput.addEventListener('keydown',function(e){
  if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(chatInput.value);}
});
chatInput.addEventListener('input',function(){
  chatInput.style.height='auto';
  chatInput.style.height=Math.min(chatInput.scrollHeight,80)+'px';
});

console.log('[HudBroker] Suporte chat carregado com sucesso');

}catch(err){
  console.error('[HudBroker] Erro ao carregar suporte:',err);
}
})();
