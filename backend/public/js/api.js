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

// Dois sons distintos: um exclusivo para os botões Comprar/Vender (#buyBtn, #sellBtn, #m_buyBtn, #m_sellBtn),
// e outro genérico para o restante dos cliques na interface.
const _tradeSoundBase = new Audio('/sounds/click.mp3');
_tradeSoundBase.volume = 0.5;
const _genericSoundBase = new Audio('/sounds/botaoclick.mp3');
_genericSoundBase.volume = 0.5;

function _playSound(base) {
  try {
    const sound = base.cloneNode();
    sound.volume = base.volume;
    sound.play().catch(() => {
      // Navegadores que bloqueiam áudio sem interação prévia do usuário: ignora silenciosamente.
    });
  } catch (err) {
    // Sem suporte a áudio: ignora silenciosamente.
  }
}

function playClickSound() { _playSound(_genericSoundBase); }
function playTradeSound() { _playSound(_tradeSoundBase); }

const TRADE_BUTTON_IDS = ['buyBtn', 'sellBtn', 'm_buyBtn', 'm_sellBtn'];

// Liga o som de clique em todos os botões e links clicáveis da página automaticamente.
// Os botões de Comprar/Vender usam o som específico de trade; o restante usa o som genérico.
function enableClickSounds() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('button, .menu-item, .asset-tab, .category-item, .account-option, .asset-option, .m-asset-drawer-item, a.btn, [role="button"]');
    if (!target) return;
    if (TRADE_BUTTON_IDS.includes(target.id)) {
      playTradeSound();
    } else {
      playClickSound();
    }
  }, true);
}
document.addEventListener('DOMContentLoaded', enableClickSounds);
