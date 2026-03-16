import { ExchangeAdapter, ExchangeName } from '@/types/exchange'
import { CoinbaseAdapter } from './coinbase'
import { BinanceAdapter } from './binance'
import { KrakenAdapter } from './kraken'
import { GeminiAdapter } from './gemini'

const adapters: Record<ExchangeName, () => ExchangeAdapter> = {
  coinbase: () => new CoinbaseAdapter(),
  binance: () => new BinanceAdapter(),
  kraken: () => new KrakenAdapter(),
  gemini: () => new GeminiAdapter(),
}

export function getExchangeAdapter(name: ExchangeName): ExchangeAdapter {
  return adapters[name]()
}
