import { SupabaseClient } from '@supabase/supabase-js'

interface JournalEntry {
  transaction_id: string
  entry_date: string
  description: string
  debit_account: string
  credit_account: string
  amount: number
  currency: string
}

// Chart of accounts mapping for crypto fund transactions
const ACCOUNT_MAP: Record<string, { debit: string; credit: string }> = {
  buy: { debit: 'Digital Assets', credit: 'Cash & Equivalents' },
  sell: { debit: 'Cash & Equivalents', credit: 'Digital Assets' },
  transfer_in: {
    debit: 'Digital Assets',
    credit: 'Digital Assets - In Transit',
  },
  transfer_out: {
    debit: 'Digital Assets - In Transit',
    credit: 'Digital Assets',
  },
  staking_reward: { debit: 'Digital Assets', credit: 'Staking Income' },
  interest: { debit: 'Digital Assets', credit: 'Interest Income' },
  income: { debit: 'Digital Assets', credit: 'Other Income' },
  fee: { debit: 'Trading Fees', credit: 'Cash & Equivalents' },
  fiat_deposit: { debit: 'Cash & Equivalents', credit: 'Contributions' },
  fiat_withdrawal: { debit: 'Distributions', credit: 'Cash & Equivalents' },
  chain_split: { debit: 'Digital Assets', credit: 'Chain Split Income' },
  gift_in: { debit: 'Digital Assets', credit: 'Gift Income' },
  gift_out: { debit: 'Gift Expense', credit: 'Digital Assets' },
}

export interface MapResult {
  entriesCreated: number
  entriesSkipped: number
  errors: string[]
}

export async function mapTransactionsToJournalEntries(
  supabase: SupabaseClient,
  orgId: string
): Promise<MapResult> {
  const result: MapResult = {
    entriesCreated: 0,
    entriesSkipped: 0,
    errors: [],
  }

  // Get transactions that don't have journal entries yet
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select(
      'id, timestamp, asset, amount, amount_usd, category, fee_amount, fee_usd, counter_asset, counter_amount'
    )
    .eq('org_id', orgId)
    .neq('category', 'unknown')

  if (error || !transactions) {
    result.errors.push(
      `Failed to fetch transactions: ${error?.message ?? 'unknown'}`
    )
    return result
  }

  // Get existing journal entries to avoid duplicates
  const { data: existingEntries } = await supabase
    .from('journal_entries')
    .select('transaction_id')
    .eq('org_id', orgId)

  const existingTxIds = new Set(
    (existingEntries ?? []).map((e) => e.transaction_id)
  )

  for (const tx of transactions) {
    if (existingTxIds.has(tx.id)) {
      result.entriesSkipped++
      continue
    }

    const accounts = ACCOUNT_MAP[tx.category]
    if (!accounts) {
      result.entriesSkipped++
      continue
    }

    // Determine USD amount
    let amount = 0
    if (tx.amount_usd) {
      amount = Math.abs(Number(tx.amount_usd))
    } else if (tx.counter_amount && tx.counter_asset === 'USD') {
      amount = Math.abs(Number(tx.counter_amount))
    } else {
      amount = Math.abs(Number(tx.amount))
    }

    if (amount === 0) {
      result.entriesSkipped++
      continue
    }

    const entry: JournalEntry = {
      transaction_id: tx.id,
      entry_date: new Date(tx.timestamp).toISOString().slice(0, 10),
      description: `${tx.category.replace('_', ' ')} — ${Math.abs(Number(tx.amount))} ${tx.asset}`,
      debit_account: accounts.debit,
      credit_account: accounts.credit,
      amount,
      currency: 'USD',
    }

    const { error: insertError } = await supabase
      .from('journal_entries')
      .insert({ org_id: orgId, ...entry })

    if (insertError) {
      result.errors.push(
        `Insert error for tx ${tx.id}: ${insertError.message}`
      )
    } else {
      result.entriesCreated++
    }

    // If there's a fee, create a separate fee entry
    if (tx.fee_usd && Number(tx.fee_usd) > 0) {
      const feeEntry: JournalEntry = {
        transaction_id: tx.id,
        entry_date: new Date(tx.timestamp).toISOString().slice(0, 10),
        description: `Fee — ${tx.category.replace('_', ' ')} ${tx.asset}`,
        debit_account: 'Trading Fees',
        credit_account: 'Cash & Equivalents',
        amount: Math.abs(Number(tx.fee_usd)),
        currency: 'USD',
      }

      await supabase
        .from('journal_entries')
        .insert({ org_id: orgId, ...feeEntry })
    }
  }

  return result
}
