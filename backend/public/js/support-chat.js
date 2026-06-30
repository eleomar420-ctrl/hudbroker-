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
'Deposito demorando',
'Esqueci minha senha'
];

var style=document.createElement('style');
style.textContent='\
.support-panel{display:none;position:fixed;left:72px;top:0;bottom:0;width:320px;background:#000000;z-index:96;flex-direction:column;border-right:1px solid var(--border,#232323);box-shadow:4px 0 20px rgba(0,0,0,0.4);}\
.support-panel.open{display:flex;}\
.support-header{display:flex;align-items:center;gap:8px;padding:10px 10px;border-bottom:1px solid var(--border,#232323);flex-shrink:0;background:#000;}\
.support-header .back-btn{background:none;border:none;color:var(--text,#e8eaed);cursor:pointer;font-size:16px;display:flex;align-items:center;padding:4px;}\
.support-header h2{flex:1;font-family:"Space Grotesk",sans-serif;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text,#e8eaed);}\
.support-header .support-status{font-size:10px;color:#08B774;display:flex;align-items:center;gap:4px;}\
.support-header .support-status::before{content:"";width:5px;height:5px;border-radius:50%;background:#08B774;}\
.support-email-box{padding:24px 16px;text-align:center;flex:1;display:flex;flex-direction:column;justify-content:center;gap:12px;}\
.support-email-box h3{color:var(--text,#e8eaed);font-size:14px;font-weight:600;margin:0;font-family:"Space Grotesk",sans-serif;}\
.support-email-box p{color:var(--text-dim,#8b92a3);font-size:12px;margin:0;line-height:1.5;}\
.support-email-box input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--border,#232323);background:var(--bg-elevated,#161616);color:var(--text,#e8eaed);font-size:13px;font-family:Inter,sans-serif;outline:none;}\
.support-email-box input:focus{border-color:var(--brand,#e8a23d);}\
.support-email-box input::placeholder{color:var(--text-faint,#5a6178);}\
.support-email-box button{width:100%;padding:10px;border-radius:8px;border:none;background:var(--brand,#e8a23d);color:#000;font-weight:600;font-size:13px;cursor:pointer;font-family:Inter,sans-serif;}\
.support-email-box button:hover{opacity:0.9;}\
.support-email-err{color:var(--down,#F92757);font-size:11px;margin:0;}\
.support-chat-area{flex:1;display:none;flex-direction:column;overflow:hidden;}\
.support-chat-area.open{display:flex;}\
.support-messages{flex:1;overflow-y:auto;padding:10px;display:flex;flex-direction:column;gap:8px;scrollbar-width:thin;scrollbar-color:#232323 transparent;}\
.support-messages::-webkit-scrollbar{width:3px;}\
.support-messages::-webkit-scrollbar-thumb{background:#232323;border-radius:3px;}\
.sup-msg{max-width:88%;padding:8px 12px;border-radius:10px;font-size:12px;line-height:1.5;word-wrap:break-word;}\
.sup-msg-bot{align-self:flex-start;background:var(--bg-elevated,#161616);color:var(--text,#e8eaed);border-bottom-left-radius:3px;}\
.sup-msg-agent{align-self:flex-start;background:#1a2332;color:var(--text,#e8eaed);border-bottom-left-radius:3px;border-left:2px solid #08B774;}\
.sup-msg-user{align-self:flex-end;background:var(--brand,#e8a23d);color:#000;border-bottom-right-radius:3px;}\
.sup-msg-system{align-self:center;background:transparent;color:var(--text-dim,#8b92a3);font-size:10px;text-align:center;padding:4px 8px;}\
.sup-msg-typing{align-self:flex-start;background:var(--bg-elevated,#161616);padding:10px 16px;border-radius:10px;border-bottom-left-radius:3px;display:flex;gap:4px;align-items:center;}\
.sup-msg-typing span{width:6px;height:6px;border-radius:50%;background:#8b92a3;animation:supBounce 1.4s infinite;}\
.sup-msg-typing span:nth-child(2){animation-delay:0.2s;}\
.sup-msg-typing span:nth-child(3){animation-delay:0.4s;}\
@keyframes supBounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-5px);}}\
.sup-quick{padding:6px 10px;display:flex;flex-wrap:wrap;gap:4px;}\
.sup-quick-btn{padding:5px 10px;border-radius:16px;font-size:10px;border:1px solid var(--border,#232323);background:var(--bg-elevated,#161616);color:var(--text-dim,#8b92a3);cursor:pointer;transition:all 0.15s;font-family:Inter,sans-serif;}\
.sup-quick-btn:hover{border-color:var(--brand,#e8a23d);color:var(--brand,#e8a23d);}\
.sup-human-bar{padding:6px 10px;}\
.sup-human-btn{width:100%;padding:8px;border-radius:8px;border:1px solid var(--border,#232323);background:var(--bg-elevated,#161616);color:var(--text-dim,#8b92a3);font-size:11px;cursor:pointer;font-family:Inter,sans-serif;transition:all 0.15s;display:flex;align-items:center;justify-content:center;gap:5px;}\
.sup-human-btn:hover{border-color:#08B774;color:#08B774;}\
.sup-human-btn.waiting{border-color:var(--brand,#e8a23d);color:var(--brand,#e8a23d);cursor:default;animation:supPulse 2s infinite;}\
@keyframes supPulse{0%,100%{opacity:1;}50%{opacity:0.6;}}\
.sup-footer{padding:8px 10px;border-top:1px solid var(--border,#232323);display:flex;gap:6px;align-items:center;}\
.sup-input{flex:1;padding:8px 10px;border-radius:8px;border:1px solid var(--border,#232323);background:var(--bg-elevated,#161616);color:var(--text,#e8eaed);font-size:12px;font-family:Inter,sans-serif;outline:none;resize:none;max-height:60px;min-height:34px;}\
.sup-input:focus{border-color:var(--brand,#e8a23d);}\
.sup-input::placeholder{color:var(--text-faint,#5a6178);}\
.sup-send{width:34px;height:34px;border-radius:8px;border:none;background:var(--brand,#e8a23d);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}\
.sup-send:hover{opacity:0.85;}\
.sup-send:disabled{opacity:0.4;cursor:not-allowed;}\
.sup-send svg{width:16px;height:16px;fill:#000;}\
@media(max-width:768px){\
.support-panel{left:0;width:100vw;z-index:200;}\
}\
@media(min-width:769px) and (max-width:1024px){\
.support-panel{left:56px;width:280px;}\
}\
';
document.head.appendChild(style);

var panel=document.createElement('div');
panel.className='support-panel';
panel.id='supportPanel';
panel.innerHTML='\
<div class="support-header">\
  <button class="back-btn" id="supBackBtn">&larr;</button>\
  <h2 id="supTitle">Suporte</h2>\
  <span class="support-status" id="supStatus">Online</span>\
</div>\
<div class="support-email-box" id="supEmailBox">\
  <h3>Suporte HudBroker</h3>\
  <p>Informe seu e-mail cadastrado para iniciar o atendimento.</p>\
  <input type="email" id="supEmailInput" placeholder="seu@email.com">\
  <p class="support-email-err" id="supEmailErr" style="display:none"></p>\
  <button id="supEmailBtn">Iniciar atendimento</button>\
</div>\
<div class="support-chat-area" id="supChatArea">\
  <div class="support-messages" id="supMessages"></div>\
  <div class="sup-quick" id="supQuick"></div>\
  <div class="sup-human-bar" id="supHumanBar">\
    <button class="sup-human-btn" id="supHumanBtn">Falar com humano</button>\
  </div>\
  <div class="sup-footer">\
    <textarea class="sup-input" id="supInput" placeholder="Digite sua duvida..." rows="1"></textarea>\
    <button class="sup-send" id="supSend"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>\
  </div>\
</div>';

var histPanel=document.getElementById('historyPanel');
if(histPanel&&histPanel.parentNode){histPanel.parentNode.insertBefore(panel,histPanel.nextSibling);}
else{document.body.appendChild(panel);}

var emailBox=document.getElementById('supEmailBox');
var chatArea=document.getElementById('supChatArea');
var emailInput=document.getElementById('supEmailInput');
var emailErr=document.getElementById('supEmailErr');
var emailBtn=document.getElementById('supEmailBtn');
var messagesEl=document.getElementById('supMessages');
var quickFaqs=document.getElementById('supQuick');
var chatInput=document.getElementById('supInput');
var sendBtn=document.getElementById('supSend');
var backBtn=document.getElementById('supBackBtn');
var humanBtn=document.getElementById('supHumanBtn');
var humanBar=document.getElementById('supHumanBar');
var titleEl=document.getElementById('supTitle');
var statusEl=document.getElementById('supStatus');

var userEmail='';
var conversationId=null;
var chatHistory=[];
var isLoading=false;
var mode='bot';
var pollTimer=null;
var lastMsgCount=0;

window.openSupportChat=function(){panel.classList.add('open');if(!userEmail)emailInput.focus();else chatInput.focus();};
window.closeSupportChat=function(){panel.classList.remove('open');};
backBtn.addEventListener('click',function(){panel.classList.remove('open');});

function validateEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}

// ─── Polling em vez de WebSocket ───
function startPolling(){
  if(pollTimer)return;
  pollTimer=setInterval(function(){
    if(!conversationId||mode==='closed')return;
    fetch('/api/support/conversations/'+conversationId+'/messages')
    .then(function(r){return r.json();})
    .then(function(data){
      if(!data.messages)return;
      var conv=data.conversation;

      // Atualizar modo se mudou
      if(conv.status!==mode){
        setMode(conv.status);
      }

      // Se tem mensagens novas
      if(data.messages.length>lastMsgCount){
        var newMsgs=data.messages.slice(lastMsgCount);
        newMsgs.forEach(function(m){
          // So adicionar mensagens de agent/system/bot (as do client ja foram adicionadas localmente)
          if(m.sender!=='client'){
            addMsg(m.sender,m.content,m.sender==='agent'?'Atendente':null);
          }
        });
        lastMsgCount=data.messages.length;
      }
    }).catch(function(){});
  },3000);
}

function stopPolling(){
  if(pollTimer){clearInterval(pollTimer);pollTimer=null;}
}

function setMode(m){
  mode=m;
  if(m==='bot'){titleEl.textContent='Suporte';statusEl.textContent='Online';humanBtn.className='sup-human-btn';humanBtn.textContent='Falar com humano';humanBar.style.display='block';}
  else if(m==='waiting'){titleEl.textContent='Aguardando...';statusEl.textContent='Na fila';humanBtn.className='sup-human-btn waiting';humanBtn.textContent='Aguardando atendente...';quickFaqs.innerHTML='';}
  else if(m==='active'){titleEl.textContent='Atendente';statusEl.textContent='Ao vivo';humanBar.style.display='none';quickFaqs.innerHTML='';}
  else if(m==='closed'){titleEl.textContent='Encerrado';statusEl.textContent='Finalizado';humanBar.style.display='none';quickFaqs.innerHTML='';stopPolling();}
}

emailBtn.addEventListener('click',startChat);
emailInput.addEventListener('keydown',function(e){if(e.key==='Enter')startChat();});

function startChat(){
  var email=emailInput.value.trim();
  if(!validateEmail(email)){emailErr.textContent='Informe um e-mail valido.';emailErr.style.display='block';return;}
  userEmail=email;
  emailErr.style.display='none';
  emailBox.style.display='none';
  chatArea.classList.add('open');
  fetch('/api/support/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email})})
  .then(function(r){return r.json();})
  .then(function(data){
    conversationId=data.conversation.id;
    setMode(data.conversation.status);
    if(data.messages&&data.messages.length>0){
      data.messages.forEach(function(m){
        addMsg(m.sender,m.content,m.sender==='agent'?'Atendente':null);
      });
      lastMsgCount=data.messages.length;
      // Reconstruir chatHistory para contexto da IA
      data.messages.forEach(function(m){
        if(m.sender==='client')chatHistory.push({role:'user',content:m.content});
        else if(m.sender==='bot')chatHistory.push({role:'assistant',content:m.content});
      });
    }else{
      addMsg('bot','Ola! Sou a Hud IA, sua assistente.\n\nComo posso te ajudar hoje?');
      lastMsgCount=0;
    }
    if(mode==='bot')renderQuick();
    startPolling();
  }).catch(function(){addMsg('bot','Ola! Como posso te ajudar?');renderQuick();});
  chatInput.focus();
}

function renderQuick(){
  quickFaqs.innerHTML='';
  QUICK_FAQS.forEach(function(q){
    var btn=document.createElement('button');
    btn.className='sup-quick-btn';btn.textContent=q;
    btn.addEventListener('click',function(){sendMsg(q);});
    quickFaqs.appendChild(btn);
  });
}

function addMsg(type,text,agentName){
  var div=document.createElement('div');
  div.className='sup-msg sup-msg-'+type;
  if(type==='agent'&&agentName){
    var lbl=document.createElement('div');
    lbl.style.cssText='font-size:9px;color:#08B774;margin-bottom:2px;font-weight:600;';
    lbl.textContent=agentName;div.appendChild(lbl);
    var s=document.createElement('span');s.textContent=text;div.appendChild(s);
  }else{div.textContent=text;}
  messagesEl.appendChild(div);messagesEl.scrollTop=messagesEl.scrollHeight;
}

function showTyping(){
  if(document.getElementById('supTyping'))return;
  var div=document.createElement('div');div.className='sup-msg-typing';div.id='supTyping';
  div.innerHTML='<span></span><span></span><span></span>';
  messagesEl.appendChild(div);messagesEl.scrollTop=messagesEl.scrollHeight;
}
function hideTyping(){var t=document.getElementById('supTyping');if(t)t.remove();}

function sendMsg(text){
  if(!text||!text.trim()||isLoading)return;
  var msg=text.trim();
  addMsg('user',msg);chatHistory.push({role:'user',content:msg});
  chatInput.value='';chatInput.style.height='auto';
  isLoading=true;sendBtn.disabled=true;

  // Atualizar contagem local pra nao duplicar no polling
  lastMsgCount++;

  if(mode==='active'||mode==='waiting'){
    fetch('/api/support/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:userEmail,message:msg,conversationId:conversationId,history:chatHistory})}).catch(function(){});
    isLoading=false;sendBtn.disabled=false;chatInput.focus();return;
  }

  showTyping();
  fetch('/api/support/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:userEmail,message:msg,conversationId:conversationId,history:chatHistory})})
  .then(function(r){return r.json();})
  .then(function(data){
    hideTyping();
    var reply=data.reply||'Desculpe, tente novamente.';
    addMsg('bot',reply);
    chatHistory.push({role:'assistant',content:reply});
    lastMsgCount++; // contabilizar resposta do bot
    if(mode==='bot')renderQuick();
  })
  .catch(function(){hideTyping();addMsg('bot','Erro de conexao. Tente novamente.');})
  .finally(function(){isLoading=false;sendBtn.disabled=false;chatInput.focus();});
}

humanBtn.addEventListener('click',function(){
  if(mode!=='bot')return;
  setMode('waiting');addMsg('system','Solicitando atendente...');
  lastMsgCount+=2; // system msgs
  fetch('/api/support/request-human',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({conversationId:conversationId})})
  .then(function(r){return r.json();}).then(function(data){addMsg('system',data.message||'Aguardando...');lastMsgCount++;})
  .catch(function(){addMsg('system','Erro. Tente novamente.');setMode('bot');});
});

sendBtn.addEventListener('click',function(){sendMsg(chatInput.value);});
chatInput.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMsg(chatInput.value);}});
chatInput.addEventListener('input',function(){chatInput.style.height='auto';chatInput.style.height=Math.min(chatInput.scrollHeight,60)+'px';});

console.log('[HudBroker] Suporte chat carregado');

}catch(err){console.error('[HudBroker] Erro suporte:',err);}
})();
