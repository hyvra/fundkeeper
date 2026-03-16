import { SupabaseClient } from '@supabase/supabase-js'

interface Transaction {
  id: string
  timestamp: string
  asset: string
  amount: number
  amount_usd: number | null
  category: string
  source_type: string
  source_id: string
  fee_amount: number
  fee_usd: number | null
  counter_amount: number | null
  counter_asset: string | null
}

interface Lot {
  transaction_id: string
  wallet_id: string | null
  wallet_type: string | null
  asset: string
  acquired_at: string
  quantity: number
  remaining_quantity: number
  cost_per_unit: number
  total_cost: number
  status: 'open' | 'depleted'
}

interface Disposal {
  transaction_id: string
  lot_id: string
  asset: string
  disposed_at: string
  quantity: number
  proceeds_per_unit: number
  total_proceeds: number
  cost_basis: number
  gain_loss: number
  holding_period: 'short_term' | 'long_term'
}

interface CostBasisResult {
  lotsCreated: number
  disposalsCreated: number
  totalGain: number
  totalLoss: number
  errors: string[]
}

function isAcquisition(category: string): boolean {
  return ['buy', 'transfer_in', 'staking_reward', 'interest', 'income', 'fiat_deposit', 'chain_split', 'gift_in'].includes(category)
}

function isDisposal(category: string): boolean {
  return ['sell', 'transfer_out', 'gift_out'].includes(category)
}

function isTransferBetweenOwn(category: string): boolean {
  return category === 'transfer_in' || category === 'transfer_out'
}

function getHoldingPeriod(acquiredAt: Date, disposedAt: Date): 'short_term' | 'long_term' {
  const diffMs = disposedAt.getTime() - acquiredAt.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  return diffDays > 365 ? 'long_term' : 'short_term'
}

export async function calculateCostBasis(
  supabase: SupabaseClient,
  orgId: string,
  asset: string
): Promise<CostBasisResult> {
  const result: CostBasisResult = {
    lotsCreated: 0,
    disposalsCreated: 0,
    totalGain: 0,
    totalLoss: 0,
    errors: [],
  }

  // Step 1: Delete existing lots and disposals for this org+asset (idempotent rebuild)
  await supabase.from('disposals').delete().eq('org_id', orgId).eq('asset', asset)
  await supabase.from('cost_basis_lots').delete().eq('org_id', orgId).eq('asset', asset)

  // Step 2: Fetch all transactions for this asset, ordered by timestamp
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('id, timestamp, asset, amount, amount_usd, category, source_type, source_id, fee_amount, fee_usd, counter_amount, counter_asset')
    .eq('org_id', orgId)
    .eq('asset', asset)
    .order('timestamp', { ascending: true })

  if (error || !transactions) {
    result.errors.push(`Failed to fetch transactions: ${error?.message ?? 'unknown'}`)
    return result
  }

  // Step 3: Build lots and disposals via FIFO
  const openLots: (Lot & { id?: string })[] = []

  for (const tx of transactions as Transaction[]) {
    const amount = Math.abs(Number(tx.amount))
    if (amount === 0) continue

    if (isAcquisition(tx.category)) {
      // Determine cost per unit
      let costPerUnit = 0
      if (tx.amount_usd && amount > 0) {
        costPerUnit = Math.abs(Number(tx.amount_usd)) / amount
      } else if (tx.counter_amount && tx.counter_asset === 'USD') {
        costPerUnit = Math.abs(Number(tx.counter_amount)) / amount
      }

      // For transfers in, cost basis is preserved (will be matched from transfer out lots)
      // For simplicity in V1, we use the USD value at time of transfer
      const lot: Lot = {
        transaction_id: tx.id,
        wallet_id: tx.source_id,
        wallet_type: tx.source_type,
        asset: tx.asset,
        acquired_at: tx.timestamp,
        quantity: amount,
        remaining_quantity: amount,
        cost_per_unit: costPerUnit,
        total_cost: costPerUnit * amount,
        status: 'open',
      }

      // Insert lot
      const { data: insertedLot, error: lotError } = await supabase
        .from('cost_basis_lots')
        .insert({ org_id: orgId, ...lot })
        .select('id')
        .single()

      if (lotError) {
        result.errors.push(`Lot insert error: ${lotError.message}`)
        continue
      }

      openLots.push({ ...lot, id: insertedLot.id })
      result.lotsCreated++
    } else if (isDisposal(tx.category)) {
      // FIFO: consume oldest lots first
      let remainingToDispose = amount

      // Calculate proceeds per unit
      let proceedsPerUnit = 0
      if (tx.amount_usd && amount > 0) {
        proceedsPerUnit = Math.abs(Number(tx.amount_usd)) / amount
      } else if (tx.counter_amount && tx.counter_asset === 'USD') {
        proceedsPerUnit = Math.abs(Number(tx.counter_amount)) / amount
      }

      // For transfers out between own wallets, no taxable event
      if (isTransferBetweenOwn(tx.category)) continue

      while (remainingToDispose > 0 && openLots.length > 0) {
        const lot = openLots[0]
        if (!lot.id) { openLots.shift(); continue }

        const consumeQty = Math.min(remainingToDispose, lot.remaining_quantity)
        const costBasis = consumeQty * lot.cost_per_unit
        const proceeds = consumeQty * proceedsPerUnit
        const gainLoss = proceeds - costBasis
        const holdingPeriod = getHoldingPeriod(new Date(lot.acquired_at), new Date(tx.timestamp))

        // Insert disposal
        const disposal: Omit<Disposal, 'lot_id'> & { lot_id: string } = {
          transaction_id: tx.id,
          lot_id: lot.id,
          asset: tx.asset,
          disposed_at: tx.timestamp,
          quantity: consumeQty,
          proceeds_per_unit: proceedsPerUnit,
          total_proceeds: proceeds,
          cost_basis: costBasis,
          gain_loss: gainLoss,
          holding_period: holdingPeriod,
        }

        const { error: dispError } = await supabase
          .from('disposals')
          .insert({ org_id: orgId, ...disposal })

        if (dispError) {
          result.errors.push(`Disposal insert error: ${dispError.message}`)
        } else {
          result.disposalsCreated++
          if (gainLoss >= 0) result.totalGain += gainLoss
          else result.totalLoss += gainLoss
        }

        // Update lot
        lot.remaining_quantity -= consumeQty
        if (lot.remaining_quantity <= 0) {
          lot.status = 'depleted'
          openLots.shift()
        }

        // Update lot in DB
        await supabase
          .from('cost_basis_lots')
          .update({
            remaining_quantity: lot.remaining_quantity,
            status: lot.status,
          })
          .eq('id', lot.id)

        remainingToDispose -= consumeQty
      }

      if (remainingToDispose > 0) {
        result.errors.push(`Insufficient lots for disposal of ${remainingToDispose} ${asset} in tx ${tx.id}`)
      }
    }
  }

  return result
}

export async function calculateAllAssets(
  supabase: SupabaseClient,
  orgId: string
): Promise<Record<string, CostBasisResult>> {
  // Get all unique assets
  const { data: assets } = await supabase
    .from('transactions')
    .select('asset')
    .eq('org_id', orgId)

  if (!assets) return {}

  const uniqueAssets = [...new Set(assets.map(a => a.asset))]
  const results: Record<string, CostBasisResult> = {}

  for (const asset of uniqueAssets) {
    // Skip fiat currencies
    if (['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF'].includes(asset.toUpperCase())) continue
    results[asset] = await calculateCostBasis(supabase, orgId, asset)
  }

  return results
}
