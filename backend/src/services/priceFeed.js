import WebSocket from 'ws';
import { EventEmitter } from 'events';

// Ativos cripto suportados (24/7 - mercado real, sem necessidade de sintetizar nada)
const CRYPTO_ASSETS = ['btcusdt', 'ethusdt', 'solusdt', 'bnbusdt', 'ltcusdt', 'adausdt'];

class PriceFeed extends EventEmitter {
  constructor() {
    super();
    this.prices = new Map(); // symbol -> { price, timestamp }
    this.ws = null;
  }

  start() {
    const streams = CRYPTO_ASSETS.map(a => `${a}@trade`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log('[price-feed] Conectado à Binance WebSocket');
    });

    this.ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const data = msg.data;
        if (!data || !data.s || !data.p) return;

        const symbol = data.s; // ex: BTCUSDT
        const price = parseFloat(data.p);
        const timestamp = data.T;

        this.prices.set(symbol, { price, timestamp });
        this.emit('price', { symbol, price, timestamp });
      } catch (err) {
        console.error('[price-feed] Erro ao processar mensagem:', err.message);
      }
    });

    this.ws.on('close', () => {
      console.warn('[price-feed] Conexão fechada. Reconectando em 3s...');
      setTimeout(() => this.start(), 3000);
    });

    this.ws.on('error', (err) => {
      console.error('[price-feed] Erro de WebSocket:', err.message);
    });
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
