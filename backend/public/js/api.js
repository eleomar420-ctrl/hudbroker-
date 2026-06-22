const API = '/api';

function getToken() { return localStorage.getItem('hb_token'); }
function setToken(t) { localStorage.setItem('hb_token', t); }
function clearToken() { localStorage.removeItem('hb_token'); }

async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API + path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Erro na requisição');
  return data;
}

function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function requireAuth(redirectTo = '/client/login.html') {
  if (!getToken()) window.location.href = redirectTo;
}

function logout(redirectTo = '/client/login.html') {
  clearToken();
  window.location.href = redirectTo;
}

function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' }).format(value);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR');
}
