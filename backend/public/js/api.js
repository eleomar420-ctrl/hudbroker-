// HudBroker — utilidades compartilhadas do frontend

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('hb_token');
}

function setToken(token) {
  localStorage.setItem('hb_token', token);
}

function requireAuth(loginUrl) {
  if (!getToken()) {
    window.location.href = loginUrl || '/client/login.html';
  }
}

function logout(redirectUrl) {
  localStorage.removeItem('hb_token');
  window.location.href = redirectUrl || '/client/login.html';
}

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, Object.assign({}, opts, { headers: headers }));
  var data = {};
  try {
    var text = await res.text();
    if (text) data = JSON.parse(text);
  } catch(e) {
    data = {};
  }

  if (!res.ok) {
    throw new Error(data.error || 'Erro ' + res.status);
  }
  return data;
}

function formatMoney(value) {
  if (value == null) return '--';
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso) {
  if (!iso) return '--';
  var d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function showToast(msg, type) {
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();

  var el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.textContent = msg;
  document.body.appendChild(el);

  setTimeout(function() { el.remove(); }, 4000);
}
