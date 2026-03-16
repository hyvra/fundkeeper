import { RawTrade, RawTransfer } from '@/types/exchange'

export interface NormalizedTransaction {
  source_type: 'exchange' | 'wallet'
  source_id: string
  external_id: string
  timestamp: string // ISO string
  asset: string
  amount: number
  amount_usd: number | null
  fee_amount: number
  fee_asset: string | null
  fee_usd: number | null
  counter_asset: string | null
  counter_amount: number | null
  category: string
  category_confidence: number
  category_source: 'rule' | 'unset'
  from_address: string | null
  to_address: string | null
  tx_hash: string | null
}

export function normalizeTrade(trade: RawTrade, sourceId: string): NormalizedTransaction {
  return {
    source_type: 'exchange',
    source_id: sourceId,
    external_id: trade.externalId,
    timestamp: trade.timestamp.toISOString(),
    asset: trade.asset,
    amount: trade.amount,
    amount_usd: trade.counterAsset === 'USD' ? trade.counterAmount : null,
    fee_amount: trade.feeAmount,
    fee_asset: trade.feeAsset,
    fee_usd: trade.feeAsset === 'USD' ? trade.feeAmount : null,
    counter_asset: trade.counterAsset,
    counter_amount: trade.counterAmount,
    category: trade.side === 'buy' ? 'buy' : 'sell',
    category_confidence: 1.0,
    category_source: 'rule',
    from_address: null,
    to_address: null,
    tx_hash: null,
  }
}

export function normalizeTransfer(transfer: RawTransfer, sourceId: string, sourceType: 'exchange' | 'wallet'): NormalizedTransaction {
  const category = transfer.type === 'deposit' ? 'transfer_in' : 'transfer_out'

  return {
    source_type: sourceType,
    source_id: sourceId,
    external_id: transfer.externalId,
    timestamp: transfer.timestamp.toISOString(),
    asset: transfer.asset,
    amount: transfer.amount,
    amount_usd: null,
    fee_amount: transfer.feeAmount ?? 0,
    fee_asset: transfer.feeAsset ?? null,
    fee_usd: null,
    counter_asset: null,
    counter_amount: null,
    category,
    category_confidence: 0.8,
    category_source: 'rule',
    from_address: transfer.fromAddress ?? null,
    to_address: transfer.toAddress ?? null,
    tx_hash: transfer.txHash ?? null,
  }
}
