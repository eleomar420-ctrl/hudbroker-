<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HudBroker — Backoffice</title>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/shared.css">
</head>
<body>
<div class="topbar">
  <div class="brand"><span class="dot"></span>Hud<span class="tag">Broker</span><span style="color:var(--text-faint); font-size: 13px; margin-left: 6px;">/ backoffice</span></div>
  <div class="topbar-right"><button class="btn" id="logoutBtn">Sair</button></div>
</div>

<div class="layout">
  <div class="sidebar">
    <a href="/backoffice/index.html" class="active">Saques pendentes</a>
  </div>

  <div class="main">
    <div class="card">
      <div class="card-title">Solicitações de saque pendentes</div>
      <table>
        <thead>
          <tr><th>Tipo</th><th>ID solicitante</th><th>Valor</th><th>Solicitado em</th><th>Ações</th></tr>
        </thead>
        <tbody id="withdrawalsBody"><tr><td colspan="5" class="empty-state">Carregando...</td></tr></tbody>
      </table>
    </div>
  </div>
</div>

<script src="/js/api.js"></script>
<script>
requireAuth('/admin/login.html'); // backoffice usa a mesma sessão admin neste MVP

async function load() {
  const items = await apiFetch('/backoffice/withdrawals?status=pending');
  const tbody = document.getElementById('withdrawalsBody');
  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma solicitação pendente</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(w => `
    <tr>
      <td><span class="badge ${w.requester_type === 'user' ? 'badge-up' : 'badge-pending'}">${w.requester_type}</span></td>
      <td style="font-size:11px;">${w.requester_id}</td>
      <td>${formatMoney(w.amount)}</td>
      <td>${formatDate(w.created_at)}</td>
      <td>
        <button class="btn btn-up" style="padding: 4px 10px; font-size: 12px;" onclick="review('${w.id}', 'approve')">Aprovar</button>
        <button class="btn btn-down" style="padding: 4px 10px; font-size: 12px;" onclick="review('${w.id}', 'reject')">Rejeitar</button>
      </td>
    </tr>
  `).join('');
}

async function review(id, action) {
  await apiFetch(`/backoffice/withdrawals/${id}`, { method: 'PATCH', body: JSON.stringify({ action }) });
  showToast(action === 'approve' ? 'Saque aprovado' : 'Saque rejeitado');
  load();
}

document.getElementById('logoutBtn').onclick = () => logout('/admin/login.html');
load();
</script>
</body>
</html>
