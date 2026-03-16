export type ChainName = 'ethereum' | 'bitcoin' | 'solana'

export interface ChainTransaction {
  txHash: string
  timestamp: Date
  asset: string
  amount: number
  fromAddress: string
  toAddress: string
  fee: number
  feeAsset: string
  type: 'incoming' | 'outgoing'
  rawData: Record<string, unknown>
}

export interface ChainBalance {
  asset: string
  balance: number
}

export interface ChainAdapter {
  chain: ChainName
  fetchTransactions(address: string, cursor?: Record<string, unknown>): Promise<{ transactions: ChainTransaction[], nextCursor?: Record<string, unknown> }>
  fetchBalance(address: string): Promise<ChainBalance[]>
}
