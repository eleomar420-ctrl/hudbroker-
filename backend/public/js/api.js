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
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR');
}

// Som de clique curto e sutil, gerado via Web Audio API (sem depender de arquivo externo).
// Reaproveita um único AudioContext para não criar um novo a cada clique.
let _clickAudioCtx = null;
function playClickSound() {
  try {
    if (!_clickAudioCtx) {
      _clickAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = _clickAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (err) {
    // Navegadores que bloqueiam áudio sem interação prévia, ou sem suporte: ignora silenciosamente.
  }
}

// Liga o som de clique em todos os botões e links clicáveis da página automaticamente.
function enableClickSounds() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .menu-item, .asset-tab, .category-item, .account-option, .asset-option, .m-asset-drawer-item, a.btn, [role="button"]');
    if (target) playClickSound();
  }, true);
}
document.addEventListener('DOMContentLoaded', enableClickSounds);
