<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HudBroker — Painel de afiliados</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/shared.css">
<style>
.link-box { display: flex; gap: 8px; }
.link-box input { font-family: var(--font-mono); font-size: 13px; }
</style>
</head>
<body>
<div class="topbar">
  <div class="brand"><span class="dot"></span>Hud<span class="tag">Broker</span><span style="color:var(--text-faint); font-size: 13px; margin-left: 6px;">/ afiliados</span></div>
  <div class="topbar-right">
    <div class="balance-pill"><span class="label">A receber</span><span id="balanceDisplay">--</span></div>
    <button class="btn" id="logoutBtn">Sair</button>
  </div>
</div>

<div class="layout">
  <div class="sidebar">
    <a href="/affiliates/dashboard.html" class="active">Meu painel</a>
    <a href="/client/index.html">Trading</a>
    <a href="/admin/index.html">Painel admin</a>
    <a href="/backoffice/index.html">Backoffice</a>
  </div>

  <div class="main">
    <div class="card">
      <div class="card-title">Seu link de divulgação</div>
      <div class="link-box">
        <input type="text" id="refLink" readonly>
        <button class="btn" id="copyBtn">Copiar</button>
      </div>
    </div>

    <div class="grid-3" style="margin-top: 16px;">
      <div class="card">
        <div class="stat-label">Cliques registrados</div>
        <div class="stat-value" id="statClicks">--</div>
      </div>
      <div class="card">
        <div class="stat-label">Clientes cadastrados</div>
        <div class="stat-value" id="statSignups">--</div>
      </div>
      <div class="card">
        <div class="stat-label">Comissão acumulada</div>
        <div class="stat-value up" id="statCommission">--</div>
      </div>
    </div>

    <div class="card" style="margin-top: 16px;">
      <div class="card-title">Solicitar saque</div>
      <div style="display:flex; gap: 10px; align-items: flex-end;">
        <div style="flex:1;"><label>Valor (USD)</label><input type="number" id="withdrawAmount" min="1"></div>
        <button class="btn btn-primary" id="withdrawBtn" style="padding: 10px 18px;">Solicitar</button>
      </div>
    </div>

    <div class="card" style="margin-top: 16px;">
      <div class="card-title">Eventos de comissão</div>
      <table>
        <thead><tr><th>Data</th><th>Tipo</th><th>Valor</th></tr></thead>
        <tbody id="eventsBody"><tr><td colspan="3" class="empty-state">Carregando...</td></tr></tbody>
      </table>
    </div>
  </div>
</div>

<script src="/js/api.js"></script>
<script>
requireAuth('/affiliates/index.html');

async function load() {
  const data = await apiFetch('/affiliates/me/stats');
  const refCode = data.affiliate.ref_code;
  document.getElementById('refLink').value = `${location.origin}/client/login.html?ref=${refCode}`;
  document.getElementById('balanceDisplay').textContent = formatMoney(data.affiliate.balance);
  document.getElementById('statClicks').textContent = data.totalClicks;
  document.getElementById('statSignups').textContent = data.totalSignups;
  document.getElementById('statCommission').textContent = formatMoney(data.totalCommission);

  const tbody = document.getElementById('eventsBody');
  if (data.events.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Nenhum evento de comissão ainda</td></tr>';
  } else {
    tbody.innerHTML = data.events.map(ev => `
      <tr>
        <td>${formatDate(ev.created_at)}</td>
        <td><span class="badge badge-pending">${ev.type.toUpperCase()}</span></td>
        <td style="color: var(--up)">+${formatMoney(ev.amount)}</td>
      </tr>
    `).join('');
  }
}

document.getElementById('copyBtn').onclick = () => {
  navigator.clipboard.writeText(document.getElementById('refLink').value);
  showToast('Link copiado');
};

document.getElementById('withdrawBtn').onclick = async () => {
  const amount = Number(document.getElementById('withdrawAmount').value);
  if (!amount) return showToast('Informe um valor', 'error');
  try {
    await apiFetch('/affiliates/me/withdraw', { method: 'POST', body: JSON.stringify({ amount }) });
    showToast('Solicitação enviada para aprovação');
    load();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

document.getElementById('logoutBtn').onclick = () => logout('/affiliates/index.html');
load();
</script>
</body>
</html>
