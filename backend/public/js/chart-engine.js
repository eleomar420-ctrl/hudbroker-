(function(){
window.HudChart = {};

var charts = {};

// ─── CSS do toolbar e ferramentas ───
var style = document.createElement('style');
style.textContent = '\
.hc-toolbar{position:absolute;top:0;left:0;right:0;height:36px;z-index:20;display:flex;align-items:center;gap:2px;padding:0 8px;background:rgba(0,0,0,0.85);border-bottom:1px solid #1a1a1a;backdrop-filter:blur(8px);}\
.hc-tf-group{display:flex;gap:1px;margin-right:8px;}\
.hc-tf-btn{padding:4px 10px;font-size:10px;font-weight:600;font-family:Inter,sans-serif;background:transparent;border:1px solid transparent;color:#666;cursor:pointer;border-radius:4px;transition:all 0.15s;}\
.hc-tf-btn:hover{color:#aaa;background:rgba(255,255,255,0.04);}\
.hc-tf-btn.act{color:#e8a23d;background:rgba(232,162,61,0.1);border-color:rgba(232,162,61,0.2);}\
.hc-sep{width:1px;height:18px;background:#1a1a1a;margin:0 6px;}\
.hc-tool-group{display:flex;gap:1px;}\
.hc-tool-btn{padding:4px 8px;font-size:11px;background:transparent;border:1px solid transparent;color:#666;cursor:pointer;border-radius:4px;transition:all 0.15s;display:flex;align-items:center;gap:4px;}\
.hc-tool-btn:hover{color:#aaa;background:rgba(255,255,255,0.04);}\
.hc-tool-btn.act{color:#08c58a;background:rgba(8,197,138,0.1);border-color:rgba(8,197,138,0.2);}\
.hc-tool-btn svg{width:14px;height:14px;}\
.hc-asset-label{margin-left:auto;font-size:11px;color:#555;font-family:Inter,sans-serif;}\
.hc-chart-wrap{position:absolute;top:36px;left:0;right:0;bottom:0;}\
.hud-pulse-dot{position:absolute;z-index:10;width:16px;height:16px;pointer-events:none;display:none;}\
.hud-pulse-core{position:absolute;top:4px;left:4px;width:8px;height:8px;border-radius:50%;background:#08c58a;z-index:2;}\
.hud-pulse-ring{position:absolute;top:0;left:0;width:16px;height:16px;border-radius:50%;border:2px solid #08c58a;animation:hudPulseRing 1.5s infinite;z-index:1;}\
@keyframes hudPulseRing{0%{transform:scale(1);opacity:1;}100%{transform:scale(2.2);opacity:0;}}\
.hc-crosshair-mode{cursor:crosshair !important;}\
';
document.head.appendChild(style);

// ─── Criar grafico ───
HudChart.create = function(containerId, tabId, asset, category) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  container.style.position = 'relative';

  // Toolbar
  var toolbar = document.createElement('div');
  toolbar.className = 'hc-toolbar';
  toolbar.innerHTML = '\
<div class="hc-tf-group" id="hcTf_'+tabId+'">\
  <button class="hc-tf-btn act" data-tf="1m">1m</button>\
  <button class="hc-tf-btn" data-tf="5m">5m</button>\
  <button class="hc-tf-btn" data-tf="15m">15m</button>\
  <button class="hc-tf-btn" data-tf="30m">30m</button>\
  <button class="hc-tf-btn" data-tf="1h">1H</button>\
</div>\
<div class="hc-sep"></div>\
<div class="hc-tool-group">\
  <button class="hc-tool-btn" id="hcLine_'+tabId+'" title="Linha horizontal (suporte/resistencia)">\
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>Linha\
  </button>\
  <button class="hc-tool-btn" id="hcTrend_'+tabId+'" title="Linha de tendencia">\
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="18" x2="21" y2="6"/></svg>Tend.\
  </button>\
  <button class="hc-tool-btn" id="hcClear_'+tabId+'" title="Limpar linhas">\
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>\
  </button>\
</div>\
<span class="hc-asset-label" id="hcLabel_'+tabId+'">'+asset+'</span>';
  container.appendChild(toolbar);

  // Chart wrapper
  var wrap = document.createElement('div');
  wrap.className = 'hc-chart-wrap';
  wrap.id = 'hcWrap_' + tabId;
  container.appendChild(wrap);

  var chart = LightweightCharts.createChart(wrap, {
    width: wrap.clientWidth,
    height: wrap.clientHeight,
    layout: {
      background: { type: 'solid', color: '#000000' },
      textColor: '#555',
      fontFamily: "'Inter', sans-serif",
      fontSize: 11
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.025)' },
      horzLines: { color: 'rgba(255,255,255,0.025)' }
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { color: 'rgba(232,162,61,0.3)', width: 1, style: 2, labelBackgroundColor: '#1a1a1a' },
      horzLine: { color: 'rgba(232,162,61,0.3)', width: 1, style: 2, labelBackgroundColor: '#1a1a1a' }
    },
    rightPriceScale: {
      borderColor: '#1a1a1a',
      scaleMargins: { top: 0.05, bottom: 0.15 },
      entireTextOnly: true
    },
    timeScale: {
      borderColor: '#1a1a1a',
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 8,
      barSpacing: 10,
      minBarSpacing: 4
    },
    handleScroll: true,
    handleScale: true
  });

  var candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
    upColor: '#08c58a',
    downColor: '#fc4b4a',
    borderUpColor: '#08c58a',
    borderDownColor: '#fc4b4a',
    wickUpColor: '#08c58a',
    wickDownColor: '#fc4b4a'
  });

  var volumeSeries = chart.addSeries(LightweightCharts.HistogramSeries, {
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume'
  });
  chart.priceScale('volume').applyOptions({
    scaleMargins: { top: 0.85, bottom: 0 }
  });

  charts[tabId] = {
    chart: chart,
    series: candleSeries,
    volumeSeries: volumeSeries,
    lastCandle: null,
    interval: '1m',
    asset: asset,
    category: category,
    pulseEl: null,
    priceLine: null,
    tradeMarkers: [],
    markersRef: null,
    drawnLines: [],
    drawMode: null,
    wrap: wrap
  };

  // Pulse dot
  createPulseDot(wrap, tabId);

  // Carregar candles
  loadCandles(tabId, asset, category, '1m');

  // Eventos da toolbar
  setupToolbar(tabId, asset, category);

  // Responsivo
  var ro = new ResizeObserver(function(){
    chart.applyOptions({ width: wrap.clientWidth, height: wrap.clientHeight });
  });
  ro.observe(wrap);

  return charts[tabId];
};

// ─── Toolbar events ───
function setupToolbar(tabId, asset, category) {
  // Timeframe buttons
  var tfGroup = document.getElementById('hcTf_' + tabId);
  if (tfGroup) {
    tfGroup.querySelectorAll('.hc-tf-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        tfGroup.querySelectorAll('.hc-tf-btn').forEach(function(b) { b.classList.remove('act'); });
        btn.classList.add('act');
        var tf = btn.getAttribute('data-tf');
        HudChart.changeInterval(tabId, tf);
      });
    });
  }

  // Linha horizontal
  var lineBtn = document.getElementById('hcLine_' + tabId);
  if (lineBtn) {
    lineBtn.addEventListener('click', function() {
      toggleDrawMode(tabId, 'hline', lineBtn);
    });
  }

  // Linha de tendencia
  var trendBtn = document.getElementById('hcTrend_' + tabId);
  if (trendBtn) {
    trendBtn.addEventListener('click', function() {
      toggleDrawMode(tabId, 'trend', trendBtn);
    });
  }

  // Limpar linhas
  var clearBtn = document.getElementById('hcClear_' + tabId);
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      clearDrawnLines(tabId);
    });
  }
}

// ─── Modo de desenho ───
function toggleDrawMode(tabId, mode, btn) {
  var info = charts[tabId];
  if (!info) return;

  // Toggle
  if (info.drawMode === mode) {
    info.drawMode = null;
    btn.classList.remove('act');
    info.wrap.style.cursor = '';
    return;
  }

  // Desativar outros
  var lineBtn = document.getElementById('hcLine_' + tabId);
  var trendBtn = document.getElementById('hcTrend_' + tabId);
  if (lineBtn) lineBtn.classList.remove('act');
  if (trendBtn) trendBtn.classList.remove('act');

  info.drawMode = mode;
  btn.classList.add('act');
  info.wrap.style.cursor = 'crosshair';

  // Listener de click no chart
  if (!info.drawListener) {
    info.chart.subscribeClick(function(param) {
      if (!info.drawMode || !param.point) return;

      if (info.drawMode === 'hline') {
        var price = info.series.coordinateToPrice(param.point.y);
        if (price) {
          var line = info.series.createPriceLine({
            price: price,
            color: '#5a78e0',
            lineWidth: 1,
            lineStyle: 0,
            axisLabelVisible: true,
            title: ''
          });
          info.drawnLines.push(line);
        }
        // Desativar apos desenhar
        info.drawMode = null;
        var lb = document.getElementById('hcLine_' + tabId);
        if (lb) lb.classList.remove('act');
        info.wrap.style.cursor = '';
      }

      if (info.drawMode === 'trend') {
        // Trend line: marcar com price line no ponto clicado (simplificado)
        var price2 = info.series.coordinateToPrice(param.point.y);
        if (price2) {
          var line2 = info.series.createPriceLine({
            price: price2,
            color: '#e8a23d',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: ''
          });
          info.drawnLines.push(line2);
        }
        info.drawMode = null;
        var tb = document.getElementById('hcTrend_' + tabId);
        if (tb) tb.classList.remove('act');
        info.wrap.style.cursor = '';
      }
    });
    info.drawListener = true;
  }
}

function clearDrawnLines(tabId) {
  var info = charts[tabId];
  if (!info) return;
  info.drawnLines.forEach(function(line) {
    try { info.series.removePriceLine(line); } catch(e) {}
  });
  info.drawnLines = [];
}

// ─── Pulse Dot ───
function createPulseDot(container, tabId) {
  var dot = document.createElement('div');
  dot.className = 'hud-pulse-dot';
  dot.id = 'pulse_' + tabId;
  dot.innerHTML = '<div class="hud-pulse-ring"></div><div class="hud-pulse-core"></div>';
  container.appendChild(dot);
  charts[tabId].pulseEl = dot;
}

function updatePulseDot(tabId, price, isUp) {
  var info = charts[tabId];
  if (!info || !info.pulseEl || !info.chart || !info.series) return;

  var color = isUp ? '#08c58a' : '#fc4b4a';
  var core = info.pulseEl.querySelector('.hud-pulse-core');
  var ring = info.pulseEl.querySelector('.hud-pulse-ring');
  if (core) core.style.background = color;
  if (ring) ring.style.borderColor = color;

  try {
    var lastCandle = info.lastCandle;
    if (!lastCandle) return;
    var y = info.series.priceToCoordinate(price);
    var x = info.chart.timeScale().timeToCoordinate(lastCandle.time);
    if (y !== null && x !== null && !isNaN(y) && !isNaN(x)) {
      info.pulseEl.style.display = 'block';
      info.pulseEl.style.left = (x - 8) + 'px';
      info.pulseEl.style.top = (y - 8) + 'px';
    }
  } catch(e) {}
}

// ─── Carregar candles ───
function loadCandles(tabId, asset, category, interval) {
  var info = charts[tabId];
  if (!info) return;
  info.interval = interval;

  if (category === 'crypto') {
    var url = 'https://api.binance.com/api/v3/klines?symbol=' + asset + '&interval=' + interval + '&limit=300';
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!Array.isArray(data)) { generateSyntheticCandles(tabId, asset); return; }
        var candles = [];
        var volumes = [];
        data.forEach(function(k) {
          var t = Math.floor(k[0] / 1000);
          var o = parseFloat(k[1]);
          var h = parseFloat(k[2]);
          var l = parseFloat(k[3]);
          var c = parseFloat(k[4]);
          var v = parseFloat(k[5]);
          candles.push({ time: t, open: o, high: h, low: l, close: c });
          volumes.push({ time: t, value: v, color: c >= o ? 'rgba(8,197,138,0.12)' : 'rgba(252,75,74,0.12)' });
        });
        info.series.setData(candles);
        info.volumeSeries.setData(volumes);
        if (candles.length > 0) info.lastCandle = candles[candles.length - 1];
        info.chart.timeScale().fitContent();
      })
      .catch(function() { generateSyntheticCandles(tabId, asset); });
  } else {
    generateSyntheticCandles(tabId, asset);
  }
}

function generateSyntheticCandles(tabId, asset) {
  var info = charts[tabId];
  if (!info) return;
  var price = 1.0;
  if (window.livePrices && window.livePrices[asset]) price = window.livePrices[asset].price || 1.0;
  var candles = [];
  var volumes = [];
  var now = Math.floor(Date.now() / 1000);
  var startTime = now - (300 * 60);
  for (var i = 0; i < 300; i++) {
    var t = startTime + (i * 60);
    var vol = price * 0.0003;
    var o = price + (Math.random() - 0.5) * vol;
    var c = o + (Math.random() - 0.5) * vol;
    var h = Math.max(o, c) + Math.random() * vol * 0.5;
    var l = Math.min(o, c) - Math.random() * vol * 0.5;
    candles.push({ time: t, open: o, high: h, low: l, close: c });
    volumes.push({ time: t, value: Math.random() * 1000, color: c >= o ? 'rgba(8,197,138,0.12)' : 'rgba(252,75,74,0.12)' });
    price = c;
  }
  info.series.setData(candles);
  info.volumeSeries.setData(volumes);
  if (candles.length > 0) info.lastCandle = candles[candles.length - 1];
  info.chart.timeScale().fitContent();
}

// ─── Atualizar preco ao vivo ───
HudChart.updatePrice = function(tabId, price, timestamp) {
  var info = charts[tabId];
  if (!info || !info.lastCandle) return;

  var intervalSec = getIntervalSeconds(info.interval);
  var candleTime = Math.floor(timestamp / intervalSec) * intervalSec;
  var last = info.lastCandle;

  if (candleTime > last.time) {
    var newCandle = { time: candleTime, open: price, high: price, low: price, close: price };
    info.series.update(newCandle);
    info.volumeSeries.update({ time: candleTime, value: 0, color: 'rgba(8,197,138,0.12)' });
    info.lastCandle = newCandle;
  } else {
    last.close = price;
    if (price > last.high) last.high = price;
    if (price < last.low) last.low = price;
    info.series.update(last);
  }

  var isUp = last.close >= last.open;
  updatePulseDot(tabId, price, isUp);
};

// ─── Marcar operacao ───
HudChart.markTrade = function(tabId, type, price, label) {
  var info = charts[tabId];
  if (!info || !info.lastCandle) return;

  // Linha de entrada
  if (info.priceLine) {
    try { info.series.removePriceLine(info.priceLine); } catch(e) {}
  }
  info.priceLine = info.series.createPriceLine({
    price: price,
    color: type === 'buy' ? '#08c58a' : '#fc4b4a',
    lineWidth: 1,
    lineStyle: 2,
    axisLabelVisible: true,
    title: label || (type === 'buy' ? 'COMPRA' : 'VENDA')
  });
};

HudChart.clearTradeLine = function(tabId) {
  var info = charts[tabId];
  if (!info || !info.priceLine) return;
  try { info.series.removePriceLine(info.priceLine); } catch(e) {}
  info.priceLine = null;
};

HudChart.changeInterval = function(tabId, interval) {
  var info = charts[tabId];
  if (!info) return;
  if (info.priceLine) { try { info.series.removePriceLine(info.priceLine); } catch(e) {} info.priceLine = null; }
  clearDrawnLines(tabId);
  loadCandles(tabId, info.asset, info.category, interval);
};

HudChart.destroy = function(tabId) {
  var info = charts[tabId];
  if (info) { info.chart.remove(); delete charts[tabId]; }
};

function getIntervalSeconds(interval) {
  var map = { '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600 };
  return map[interval] || 60;
}

HudChart.getInfo = function(tabId) { return charts[tabId] || null; };

})();
