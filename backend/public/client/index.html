<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HudBroker — Trading</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/shared.css">
<style>
.trade-layout { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
#tv_chart { height: 520px; border-radius: 12px; overflow: hidden; }
.asset-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.asset-tab {
  padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg-elevated); cursor: pointer; font-size: 13px; font-family: var(--font-mono);
}
.asset-tab.active { border-color: var(--brand); color: var(--brand); }
.direction-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 16px 0; }
.dir-btn { padding: 16px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-elevated); cursor: pointer; text-align: center; font-weight: 600; }
.dir-btn.up { color: var(--up); }
.dir-btn.down { color: var(--down); }
.dir-btn.selected.up { background: var(--up-dim); border-color: var(--up); }
.dir-btn.selected.down { background: var(--down-dim); border-color: var(--down); }
.live-price { font-family: var(--font-mono); font-size: 28px; font-weight: 500; }
.payout-note { color: var(--text-faint); font-size: 12px; margin-top: 8px; }
.duration-row { display: flex; gap: 8px; margin-bottom: 14px; }
.duration-btn { flex: 1; padding: 8px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-elevated); cursor: pointer; font-size: 12px; font-family: var(--font-mono); }
.duration-btn.active { border-color: var(--brand); color: var(--brand); }
.countdown { font-family: var(--font-mono); color: var(--brand); }
</style>
</head>
<body>
<div class="topbar">
  <div class="brand"><span class="dot"></span>Hud<span class="tag">Broker</span></div>
  <div class="topbar-right">
    <div class="balance-pill"><span class="label">Saldo</span><span id="balanceDisplay">--</span></div>
    <button class="btn" id="depositBtn">Depositar</button>
    <button class="btn" id="logoutBtn">Sair</button>
  </div>
</div>

<div class="layout">
  <div class="sidebar">
    <a href="/client/index.html" class="active">Trading</a>
    <a href="/client/history.html">Histórico</a>
    <a href="/affiliates/index.html">Painel de afiliados</a>
    <a href="/admin/index.html">Painel admin</a>
    <a href="/backoffice/index.html">Backoffice</a>
  </div>

  <div class="main">
    <div class="asset-tabs">
      <div class="asset-tab active" data-asset="BTCUSDT">BTC/USDT</div>
      <div class="asset-tab" data-asset="ETHUSDT">ETH/USDT</div>
      <div class="asset-tab" data-asset="SOLUSDT">SOL/USDT</div>
      <div class="asset-tab" data-asset="BNBUSDT">BNB/USDT</div>
    </div>

    <div class="trade-layout">
      <div class="card" style="padding: 0;">
        <div id="tv_chart"></div>
      </div>

      <div>
        <div class="card">
          <div class="stat-label">Preço ao vivo</div>
          <div class="live-price" id="livePrice">--</div>
        </div>

        <div class="card">
          <div class="card-title">Nova operação</div>

          <label>Valor da operação (USD)</label>
          <input type="number" id="stakeInput" value="100" min="1" step="1">

          <div style="margin-top: 14px;">
            <label>Tempo de expiração</label>
            <div class="duration-row">
              <div class="duration-btn" data-sec="30">30s</div>
              <div class="duration-btn active" data-sec="60">1min</div>
              <div class="duration-btn" data-sec="300">5min</div>
              <div class="duration-btn" data-sec="900">15min</div>
            </div>
          </div>

          <div class="direction-row">
            <div class="dir-btn up selected" id="dirUp">↑ Subir</div>
            <div class="dir-btn down" id="dirDown">↓ Cair</div>
          </div>

          <button class="btn btn-primary" id="openTradeBtn" style="width: 100%; padding: 14px; font-size: 15px;">
            Abrir operação
          </button>
          <div class="payout-note">Payout de 85% se a previsão estiver correta</div>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top: 16px;">
      <div class="card-title">Operações em andamento</div>
      <table>
        <thead>
          <tr><th>Ativo</th><th>Direção</th><th>Valor</th><th>Entrada</th><th>Expira em</th></tr>
        </thead>
        <tbody id="openTradesBody">
          <tr><td colspan="5" class="empty-state">Nenhuma operação em andamento</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<script src="/js/api.js"></script>
<script src="https://s3.tradingview.com/tv.js"></script>
<script>
requireAuth();

let currentAsset = 'BTCUSDT';
let selectedDirection = 'up';
let selectedDuration = 60;
let livePrices = {};

function loadChart(symbol) {
  document.getElementById('tv_chart').innerHTML = '';
  new TradingView.widget({
    container_id: 'tv_chart',
    autosize: true,
    symbol: `BINANCE:${symbol}`,
    interval: '1',
    timezone: 'America/Sao_Paulo',
    theme: 'dark',
    style: '1',
    locale: 'br',
    toolbar_bg: '#131720',
    enable_publishing: false,
    hide_top_toolbar: false,
    hide_legend: false,
    save_image: false
  });
}

function connectPriceFeed() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws/prices`);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'snapshot') {
      livePrices = msg.prices;
    } else if (msg.type === 'price') {
      livePrices[msg.symbol] = { price: msg.price, timestamp: msg.timestamp };
    }
    updateLivePrice();
  };

  ws.onclose = () => setTimeout(connectPriceFeed, 2000);
}

function updateLivePrice() {
  const entry = livePrices[currentAsset];
  document.getElementById('livePrice').textContent = entry ? `$${entry.price.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : 'Aguardando...';
}

document.querySelectorAll('.asset-tab').forEach(tab => {
  tab.onclick = () => {
    document.querySelectorAll('.asset-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentAsset = tab.dataset.asset;
    loadChart(currentAsset);
    updateLivePrice();
  };
});

document.querySelectorAll('.duration-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.duration-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDuration = Number(btn.dataset.sec);
  };
});

document.getElementById('dirUp').onclick = () => {
  selectedDirection = 'up';
  document.getElementById('dirUp').classList.add('selected');
  document.getElementById('dirDown').classList.remove('selected');
};
document.getElementById('dirDown').onclick = () => {
  selectedDirection = 'down';
  document.getElementById('dirDown').classList.add('selected');
  document.getElementById('dirUp').classList.remove('selected');
};

async function refreshBalance() {
  try {
    const me = await apiFetch('/trading/me');
    document.getElementById('balanceDisplay').textContent = formatMoney(me.balance);
  } catch (err) { /* token inválido, etc */ }
}

async function refreshOpenTrades() {
  const trades = await apiFetch('/trading/trades/open');
  const tbody = document.getElementById('openTradesBody');
  if (trades.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Nenhuma operação em andamento</td></tr>';
    return;
  }
  tbody.innerHTML = trades.map(t => `
    <tr>
      <td>${t.asset}</td>
      <td><span class="badge ${t.direction === 'up' ? 'badge-up' : 'badge-down'}">${t.direction === 'up' ? '↑ Subir' : '↓ Cair'}</span></td>
      <td>${formatMoney(t.stake)}</td>
      <td>${t.entry_price.toLocaleString('en-US')}</td>
      <td class="countdown" data-expires="${t.expires_at}">--</td>
    </tr>
  `).join('');
}

setInterval(() => {
  document.querySelectorAll('.countdown').forEach(el => {
    const diff = Math.max(0, Math.floor((new Date(el.dataset.expires) - new Date()) / 1000));
    el.textContent = diff > 0 ? `${diff}s` : 'Resolvendo...';
    if (diff === 0) setTimeout(() => { refreshOpenTrades(); refreshBalance(); }, 1500);
  });
}, 1000);

document.getElementById('openTradeBtn').onclick = async () => {
  try {
    const stake = Number(document.getElementById('stakeInput').value);
    await apiFetch('/trading/trades', {
      method: 'POST',
      body: JSON.stringify({
        asset: currentAsset,
        direction: selectedDirection,
        stake,
        durationSeconds: selectedDuration,
        payoutPct: 0.85
      })
    });
    showToast('Operação aberta com sucesso');
    refreshBalance();
    refreshOpenTrades();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

document.getElementById('depositBtn').onclick = async () => {
  const amount = prompt('Valor do depósito demo (USD):', '500');
  if (!amount) return;
  try {
    await apiFetch('/trading/deposit', { method: 'POST', body: JSON.stringify({ amount: Number(amount) }) });
    showToast('Depósito realizado');
    refreshBalance();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

document.getElementById('logoutBtn').onclick = () => logout();

loadChart(currentAsset);
connectPriceFeed();
refreshBalance();
refreshOpenTrades();
setInterval(refreshOpenTrades, 5000);
setInterval(refreshBalance, 8000);
</script>
</body>
</html>
