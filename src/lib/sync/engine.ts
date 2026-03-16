import { SupabaseClient } from '@supabase/supabase-js'
import { getExchangeAdapter } from '@/lib/exchanges'
import { ExchangeCredentials, ExchangeName } from '@/types/exchange'
import { normalizeTrade, normalizeTransfer, NormalizedTransaction } from './normalizer'

interface SyncOptions {
  connectionId: string
  connectionType: 'exchange' | 'wallet'
  exchange?: ExchangeName
  credentials?: ExchangeCredentials
  orgId: string
  cursor?: Record<string, unknown>
}

interface SyncReport {
  tradesInserted: number
  transfersInserted: number
  duplicatesSkipped: number
  errors: string[]
  newCursor?: Record<string, unknown>
}

export async function syncConnection(
  supabase: SupabaseClient,
  options: SyncOptions
): Promise<SyncReport> {
  const report: SyncReport = {
    tradesInserted: 0,
    transfersInserted: 0,
    duplicatesSkipped: 0,
    errors: [],
  }

  if (options.connectionType !== 'exchange' || !options.exchange || !options.credentials) {
    report.errors.push('Wallet sync not yet implemented')
    return report
  }

  const adapter = getExchangeAdapter(options.exchange)

  // Fetch trades
  try {
    const { trades, nextCursor: tradeCursor } = await adapter.fetchTrades(
      options.credentials,
      options.cursor
    )

    for (const trade of trades) {
      const normalized = normalizeTrade(trade, options.connectionId)
      const result = await upsertTransaction(supabase, options.orgId, trade.rawData, normalized)
      if (result === 'inserted') report.tradesInserted++
      else if (result === 'duplicate') report.duplicatesSkipped++
    }

    report.newCursor = { ...report.newCursor, ...tradeCursor }
  } catch (err) {
    report.errors.push(`Trade sync failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Fetch transfers
  try {
    const { transfers, nextCursor: transferCursor } = await adapter.fetchTransfers(
      options.credentials,
      options.cursor
    )

    for (const transfer of transfers) {
      const normalized = normalizeTransfer(transfer, options.connectionId, 'exchange')
      const result = await upsertTransaction(supabase, options.orgId, transfer.rawData, normalized)
      if (result === 'inserted') report.transfersInserted++
      else if (result === 'duplicate') report.duplicatesSkipped++
    }

    report.newCursor = { ...report.newCursor, ...transferCursor }
  } catch (err) {
    report.errors.push(`Transfer sync failed: ${err instanceof Error ? err.message : String(err)}`)
  }

  // Update connection status and cursor
  await supabase
    .from('exchange_connections')
    .update({
      last_sync_at: new Date().toISOString(),
      sync_cursor: report.newCursor ?? {},
      status: report.errors.length > 0 ? 'error' : 'active',
      error_message: report.errors.length > 0 ? report.errors.join('; ') : null,
    })
    .eq('id', options.connectionId)

  return report
}

async function upsertTransaction(
  supabase: SupabaseClient,
  orgId: string,
  rawData: Record<string, unknown>,
  normalized: NormalizedTransaction
): Promise<'inserted' | 'duplicate' | 'error'> {
  // Insert raw transaction (dedup via unique index)
  const { data: rawTx, error: rawError } = await supabase
    .from('raw_transactions')
    .upsert(
      {
        org_id: orgId,
        source_type: normalized.source_type,
        source_id: normalized.source_id,
        external_id: normalized.external_id,
        raw_data: rawData,
      },
      { onConflict: 'org_id,source_type,source_id,external_id' }
    )
    .select('id')
    .single()

  if (rawError) {
    console.error('Raw tx upsert error:', rawError)
    return 'error'
  }

  // Insert normalized transaction (dedup via unique index)
  const { error: txError } = await supabase
    .from('transactions')
    .upsert(
      {
        org_id: orgId,
        raw_transaction_id: rawTx.id,
        ...normalized,
      },
      { onConflict: 'org_id,source_type,source_id,external_id' }
    )

  if (txError) {
    if (txError.code === '23505') return 'duplicate' // unique violation
    console.error('Transaction upsert error:', txError)
    return 'error'
  }

  return 'inserted'
}
