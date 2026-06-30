<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HudBroker — Afiliados</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/shared.css">
</head>
<body>
<div class="auth-shell">
  <div class="auth-card">
    <div class="brand" style="margin-bottom: 24px;"><span class="dot"></span>Hud<span class="tag">Broker</span><span style="color:var(--text-faint); font-size: 13px; margin-left: 6px;">/ afiliados</span></div>

    <div id="loginView">
      <h1>Entrar</h1>
      <div class="sub">Acesse seu painel de afiliado</div>
      <form id="loginForm">
        <div class="field"><label>Email</label><input type="email" id="loginEmail" required value="afiliado@hudbroker.com"></div>
        <div class="field"><label>Senha</label><input type="password" id="loginPassword" required value="afiliado123"></div>
        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">Entrar</button>
      </form>
      <p style="margin-top: 16px; font-size: 13px; color: var(--text-faint);">
        Novo por aqui? <a href="#" id="goRegister" style="color: var(--brand);">Cadastre-se como afiliado</a>
      </p>
    </div>

    <div id="registerView" style="display:none;">
      <h1>Tornar-se afiliado</h1>
      <div class="sub">Ganhe comissão por cada cliente indicado</div>
      <form id="registerForm">
        <div class="field"><label>Nome</label><input type="text" id="regName" required></div>
        <div class="field"><label>Email</label><input type="email" id="regEmail" required></div>
        <div class="field"><label>Senha</label><input type="password" id="regPassword" required minlength="6"></div>
        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 12px;">Cadastrar</button>
      </form>
      <p style="margin-top: 16px; font-size: 13px; color: var(--text-faint);">
        Já é afiliado? <a href="#" id="goLogin" style="color: var(--brand);">Entrar</a>
      </p>
    </div>
  </div>
</div>

<script src="/js/api.js"></script>
<script>
document.getElementById('goRegister').onclick = (e) => { e.preventDefault(); document.getElementById('loginView').style.display='none'; document.getElementById('registerView').style.display='block'; };
document.getElementById('goLogin').onclick = (e) => { e.preventDefault(); document.getElementById('registerView').style.display='none'; document.getElementById('loginView').style.display='block'; };

document.getElementById('loginForm').onsubmit = async (e) => {
  e.preventDefault();
  try {
    const data = await apiFetch('/auth/affiliate/login', { method: 'POST', body: JSON.stringify({
      email: document.getElementById('loginEmail').value,
      password: document.getElementById('loginPassword').value
    })});
    setToken(data.token);
    window.location.href = '/affiliates/dashboard.html';
  } catch (err) {
    showToast(err.message, 'error');
  }
};

document.getElementById('registerForm').onsubmit = async (e) => {
  e.preventDefault();
  try {
    await apiFetch('/affiliates/register', { method: 'POST', body: JSON.stringify({
      name: document.getElementById('regName').value,
      email: document.getElementById('regEmail').value,
      password: document.getElementById('regPassword').value
    })});
    showToast('Cadastro realizado, agora faça login');
    document.getElementById('registerView').style.display='none';
    document.getElementById('loginView').style.display='block';
  } catch (err) {
    showToast(err.message, 'error');
  }
};
</script>
</body>
</html>
