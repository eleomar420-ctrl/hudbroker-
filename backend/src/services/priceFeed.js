import WebSocket from 'ws';
import { EventEmitter } from 'events';

// Crypto via Binance real-time
const CRYPTO_ASSETS = ['btcusdt','ethusdt','solusdt','bnbusdt','ltcusdt','adausdt','xrpusdt','avaxusdt','dogeusdt','suiusdt','linkusdt','xlmusdt'];

// Forex - preços base (atualizados via simulação OTC)
const FOREX_BASE = {
  EURUSD:1.173,EURGBP:0.871,AUDJPY:97.602,GBPUSD:1.347,AUDCAD:0.911,
  USDCAD:1.382,NZDUSD:0.586,USDJPY:148.139,CADJPY:107.191,CHFJPY:186.060,
  EURNZD:2.024,AUDCHF:0.524,EURAUD:1.784,GBPCHF:1.069,GBPAUD:2.042,
  GBPJPY:199.903,USDCHF:0.799,NZDJPY:86.518,EURCHF:0.934,CADCHF:0.575,
  EURCAD:1.625,AUDUSD:0.649,AUDNZD:1.153,NZDCHF:0.452,GBPCAD:1.848,
  GBPNZD:2.339,NZDCAD:0.790
};

class PriceFeed extends EventEmitter {
  constructor() {
    super();
    this.prices = new Map();
    this.ws = null;
  }

  start() {
    // 1. Crypto via Binance WebSocket
    const streams = CRYPTO_ASSETS.map(a => `${a}@trade`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    this.ws = new WebSocket(url);
    this.ws.on('open', () => console.log('[price-feed] Conectado à Binance WebSocket'));
    this.ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const data = msg.data;
        if (!data || !data.s || !data.p) return;
        const symbol = data.s;
        const price = parseFloat(data.p);
        const timestamp = data.T;
        this.prices.set(symbol, { price, timestamp });
        this.emit('price', { symbol, price, timestamp });
      } catch (err) {}
    });
    this.ws.on('close', () => {
      console.warn('[price-feed] Reconectando em 3s...');
      setTimeout(() => this.start(), 3000);
    });
    this.ws.on('error', (err) => console.error('[price-feed] Erro:', err.message));

    // 2. Forex OTC - simular preços com variação realista
    for (const [symbol, base] of Object.entries(FOREX_BASE)) {
      this.prices.set(symbol, { price: base, timestamp: Date.now() });
    }

    // Atualizar forex a cada 1 segundo com pequena variação
    setInterval(() => {
      for (const [symbol, base] of Object.entries(FOREX_BASE)) {
        const current = this.prices.get(symbol);
        const price = current ? current.price : base;
        // Variação de ±0.01% por tick
        const change = price * (Math.random() - 0.5) * 0.0002;
        const newPrice = parseFloat((price + change).toFixed(symbol.includes('JPY') ? 3 : 5));
        const timestamp = Date.now();
        this.prices.set(symbol, { price: newPrice, timestamp });
        this.emit('price', { symbol, price: newPrice, timestamp });
      }
    }, 1000);
  }

  getPrice(symbol) {
    const entry = this.prices.get(symbol.toUpperCase());
    return entry ? entry.price : null;
  }

  getAllPrices() {
    return Object.fromEntries(this.prices);
  }
}

export const priceFeed = new PriceFeed();
