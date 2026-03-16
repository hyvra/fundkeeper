export type ExchangeName = 'coinbase' | 'binance' | 'kraken' | 'gemini'
export type ChainName = 'ethereum' | 'bitcoin' | 'solana'

export interface ExchangeCredentials {
  apiKey: string
  apiSecret: string
  passphrase?: string // Coinbase Pro
}

export interface RawTrade {
  externalId: string
  timestamp: Date
  asset: string
  amount: number
  counterAsset: string
  counterAmount: number
  feeAmount: number
  feeAsset: string
  side: 'buy' | 'sell'
  rawData: Record<string, unknown>
}

export interface RawTransfer {
  externalId: string
  timestamp: Date
  asset: string
  amount: number
  type: 'deposit' | 'withdrawal'
  fromAddress?: string
  toAddress?: string
  txHash?: string
  feeAmount?: number
  feeAsset?: string
  rawData: Record<string, unknown>
}

export interface ExchangeBalance {
  asset: string
  available: number
  hold: number
  total: number
}

export interface SyncResult {
  trades: RawTrade[]
  transfers: RawTransfer[]
  cursor?: Record<string, unknown> // for resumable sync
}

export interface ExchangeAdapter {
  name: ExchangeName
  validateCredentials(creds: ExchangeCredentials): Promise<boolean>
  fetchTrades(creds: ExchangeCredentials, cursor?: Record<string, unknown>): Promise<{ trades: RawTrade[], nextCursor?: Record<string, unknown> }>
  fetchTransfers(creds: ExchangeCredentials, cursor?: Record<string, unknown>): Promise<{ transfers: RawTransfer[], nextCursor?: Record<string, unknown> }>
  fetchBalances(creds: ExchangeCredentials): Promise<ExchangeBalance[]>
}
