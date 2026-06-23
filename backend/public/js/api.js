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

// Som de clique real (arquivo de áudio), pré-carregado uma vez.
// Usa .cloneNode() a cada clique para permitir cliques rápidos/sobrepostos sem cortar o som anterior.
const _clickSoundBase = new Audio('/sounds/click.mp3');
_clickSoundBase.volume = 0.5;
function playClickSound() {
  try {
    const sound = _clickSoundBase.cloneNode();
    sound.volume = _clickSoundBase.volume;
    sound.play().catch(() => {
      // Navegadores que bloqueiam áudio sem interação prévia do usuário: ignora silenciosamente.
    });
  } catch (err) {
    // Sem suporte a áudio: ignora silenciosamente.
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
