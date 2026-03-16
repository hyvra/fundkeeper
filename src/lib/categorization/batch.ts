import { SupabaseClient } from '@supabase/supabase-js'
import { categorizeTransaction, shouldAutoApply, TransactionInput } from './rules'

interface BatchResult {
  total: number
  autoApplied: number
  suggested: number
  unchanged: number
}

export async function batchCategorize(
  supabase: SupabaseClient,
  orgId: string
): Promise<BatchResult> {
  const result: BatchResult = {
    total: 0,
    autoApplied: 0,
    suggested: 0,
    unchanged: 0,
  }

  // Fetch uncategorized or unknown transactions
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, source_type, asset, amount, counter_asset, counter_amount, fee_amount, fee_asset, from_address, to_address, tx_hash, category, notes, raw_transaction_id')
    .eq('org_id', orgId)
    .in('category', ['unknown'])
    .eq('category_source', 'unset')
    .limit(1000)

  if (error || !transactions) return result
  result.total = transactions.length

  for (const tx of transactions) {
    const input: TransactionInput = {
      source_type: tx.source_type,
      asset: tx.asset,
      amount: Number(tx.amount),
      counter_asset: tx.counter_asset,
      counter_amount: tx.counter_amount ? Number(tx.counter_amount) : null,
      fee_amount: Number(tx.fee_amount ?? 0),
      fee_asset: tx.fee_asset,
      from_address: tx.from_address,
      to_address: tx.to_address,
      tx_hash: tx.tx_hash,
      category: tx.category,
      notes: tx.notes,
    }

    const { category, confidence } = categorizeTransaction(input)

    if (category === 'unknown') {
      result.unchanged++
      continue
    }

    if (shouldAutoApply(confidence)) {
      await supabase
        .from('transactions')
        .update({
          category,
          category_confidence: confidence,
          category_source: 'rule',
        })
        .eq('id', tx.id)
      result.autoApplied++
    } else {
      // Store suggestion but don't auto-apply
      await supabase
        .from('transactions')
        .update({
          category,
          category_confidence: confidence,
          category_source: 'rule',
        })
        .eq('id', tx.id)
      result.suggested++
    }
  }

  return result
}
