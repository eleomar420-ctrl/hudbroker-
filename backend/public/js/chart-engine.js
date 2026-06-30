/* ═══════════════════════════════════════════════
   HudBroker – Chart Engine (Lightweight Charts)
   ═══════════════════════════════════════════════ */
(function(){
window.HudChart = {};

var charts = {};       // tabId -> { chart, series, volumeSeries, lastCandle, interval }
var chartIntervals = {};  // tabId -> setInterval id

// ─── Criar gráfico para uma tab ───
HudChart.create = function(containerId, tabId, asset, category) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  var chart = LightweightCharts.createChart(container, {
    width: container.clientWidth,
    height: container.clientHeight,
    layout: {
      background: { type: 'solid', color: '#000000' },
      textColor: '#666',
      fontFamily: "'Inter', sans-serif",
      fontSize: 11
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.03)' },
      horzLines: { color: 'rgba(255,255,255,0.03)' }
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { color: 'rgba(255,255,255,0.15)', labelBackgroundColor: '#1a1a1a' },
      horzLine: { color: 'rgba(255,255,255,0.15)', labelBackgroundColor: '#1a1a1a' }
    },
    rightPriceScale: {
      borderColor: '#1a1a1a',
      scaleMargins: { top: 0.1, bottom: 0.2 }
    },
    timeScale: {
      borderColor: '#1a1a1a',
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 5,
      barSpacing: 8
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
    tradeMarkers: []
  };

  // Criar o pulse dot
  createPulseDot(container, tabId);

  // Carregar candles
  loadCandles(tabId, asset, category, '1m');

  // Responsivo
  var ro = new ResizeObserver(function(){
    chart.applyOptions({ width: container.clientWidth, height: container.clientHeight });
  });
  ro.observe(container);

  return charts[tabId];
};

// ─── Pulse Dot (bolinha piscando) ───
function createPulseDot(container, tabId) {
  var dot = document.createElement('div');
  dot.className = 'hud-pulse-dot';
  dot.id = 'pulse_' + tabId;
  dot.innerHTML = '<div class="hud-pulse-ring"></div><div class="hud-pulse-core"></div>';
  container.style.position = 'relative';
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

  // Posicionar na coordenada do ultimo preco
  try {
    var timeScale = info.chart.timeScale();
    var priceScale = info.series.priceScale();
    var lastCandle = info.lastCandle;
    if (!lastCandle) return;

    var y = info.series.priceToCoordinate(price);
    var x = timeScale.timeToCoordinate(lastCandle.time);

    if (y !== null && x !== null) {
      info.pulseEl.style.display = 'block';
      info.pulseEl.style.left = (x - 8) + 'px';
      info.pulseEl.style.top = (y - 8) + 'px';
    }
  } catch(e) {
    // Fallback: posicionar no canto direito
    info.pulseEl.style.display = 'block';
    info.pulseEl.style.right = '60px';
    info.pulseEl.style.top = '50%';
    info.pulseEl.style.left = 'auto';
  }
}

// ─── Carregar candles ───
function loadCandles(tabId, asset, category, interval) {
  var info = charts[tabId];
  if (!info) return;
  info.interval = interval;

  if (category === 'crypto') {
    // Binance API publica (sem CORS)
    var url = 'https://api.binance.com/api/v3/klines?symbol=' + asset + '&interval=' + interval + '&limit=300';
    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
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
          volumes.push({ time: t, value: v, color: c >= o ? 'rgba(8,197,138,0.15)' : 'rgba(252,75,74,0.15)' });
        });
        info.series.setData(candles);
        info.volumeSeries.setData(volumes);
        if (candles.length > 0) {
          info.lastCandle = candles[candles.length - 1];
        }
        info.chart.timeScale().fitContent();
      })
      .catch(function(err) {
        console.error('[chart] Erro ao carregar candles:', err);
        generateSyntheticCandles(tabId, asset);
      });
  } else {
    // Forex: gerar candles sinteticos
    generateSyntheticCandles(tabId, asset);
  }
}

function generateSyntheticCandles(tabId, asset) {
  var info = charts[tabId];
  if (!info) return;
  var price = 1.0;
  if (window.livePrices && window.livePrices[asset]) {
    price = window.livePrices[asset].price || 1.0;
  }
  var candles = [];
  var volumes = [];
  var now = Math.floor(Date.now() / 1000);
  var startTime = now - (300 * 60); // 300 candles de 1min

  for (var i = 0; i < 300; i++) {
    var t = startTime + (i * 60);
    var volatility = price * 0.0003;
    var o = price + (Math.random() - 0.5) * volatility;
    var c = o + (Math.random() - 0.5) * volatility;
    var h = Math.max(o, c) + Math.random() * volatility * 0.5;
    var l = Math.min(o, c) - Math.random() * volatility * 0.5;
    var v = Math.random() * 1000;
    candles.push({ time: t, open: o, high: h, low: l, close: c });
    volumes.push({ time: t, value: v, color: c >= o ? 'rgba(8,197,138,0.15)' : 'rgba(252,75,74,0.15)' });
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
    // Nova vela
    var newCandle = { time: candleTime, open: price, high: price, low: price, close: price };
    info.series.update(newCandle);
    info.volumeSeries.update({ time: candleTime, value: 0, color: 'rgba(8,197,138,0.15)' });
    info.lastCandle = newCandle;
  } else {
    // Atualizar vela atual
    last.close = price;
    if (price > last.high) last.high = price;
    if (price < last.low) last.low = price;
    info.series.update(last);
    info.volumeSeries.update({
      time: last.time,
      value: 1,
      color: last.close >= last.open ? 'rgba(8,197,138,0.15)' : 'rgba(252,75,74,0.15)'
    });
  }

  // Atualizar pulse dot
  var isUp = last.close >= last.open;
  updatePulseDot(tabId, price, isUp);
};

// ─── Marcar operacao no grafico ───
HudChart.markTrade = function(tabId, type, price, label) {
  var info = charts[tabId];
  if (!info || !info.lastCandle) return;

  var marker = {
    time: info.lastCandle.time,
    position: type === 'buy' ? 'belowBar' : 'aboveBar',
    color: type === 'buy' ? '#08c58a' : '#fc4b4a',
    shape: type === 'buy' ? 'arrowUp' : 'arrowDown',
    text: label || (type === 'buy' ? 'COMPRA' : 'VENDA')
  };

  info.tradeMarkers.push(marker);
  // Ordenar por tempo
  info.tradeMarkers.sort(function(a, b) { return a.time - b.time; });
  info.series.setMarkers(info.tradeMarkers);

  // Adicionar linha de preco de entrada
  if (info.priceLine) {
    info.series.removePriceLine(info.priceLine);
  }
  info.priceLine = info.series.createPriceLine({
    price: price,
    color: type === 'buy' ? '#08c58a' : '#fc4b4a',
    lineWidth: 1,
    lineStyle: 2,
    axisLabelVisible: true,
    title: 'Entrada'
  });
};

// ─── Remover linha de entrada ───
HudChart.clearTradeLine = function(tabId) {
  var info = charts[tabId];
  if (!info) return;
  if (info.priceLine) {
    info.series.removePriceLine(info.priceLine);
    info.priceLine = null;
  }
};

// ─── Trocar timeframe ───
HudChart.changeInterval = function(tabId, interval) {
  var info = charts[tabId];
  if (!info) return;
  info.tradeMarkers = [];
  if (info.priceLine) {
    info.series.removePriceLine(info.priceLine);
    info.priceLine = null;
  }
  loadCandles(tabId, info.asset, info.category, interval);
};

// ─── Destruir gráfico ───
HudChart.destroy = function(tabId) {
  var info = charts[tabId];
  if (!info) return;
  info.chart.remove();
  delete charts[tabId];
};

// ─── Utilitarios ───
function getIntervalSeconds(interval) {
  var map = { '1m': 60, '5m': 300, '15m': 900, '30m': 1800, '1h': 3600, '4h': 14400, '1d': 86400 };
  return map[interval] || 60;
}

HudChart.getInfo = function(tabId) { return charts[tabId] || null; };

})();
