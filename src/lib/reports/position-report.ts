import { SupabaseClient } from '@supabase/supabase-js'

export interface PositionEntry {
  asset: string
  totalQuantity: number
  totalCost: number
  averageCost: number
  // Note: current price would come from a price feed - for V1 we show cost basis only
}

export interface PositionReport {
  generatedAt: string
  periodEnd: string
  positions: PositionEntry[]
  totalCostBasis: number
}

export async function generatePositionReport(
  supabase: SupabaseClient,
  orgId: string,
  periodEnd: Date = new Date()
): Promise<PositionReport> {
  // Get all open lots
  const { data: lots } = await supabase
    .from('cost_basis_lots')
    .select('asset, remaining_quantity, cost_per_unit')
    .eq('org_id', orgId)
    .eq('status', 'open')
    .gt('remaining_quantity', 0)

  // Aggregate by asset
  const assetMap = new Map<string, { quantity: number; cost: number }>()

  for (const lot of lots ?? []) {
    const existing = assetMap.get(lot.asset) ?? { quantity: 0, cost: 0 }
    const qty = Number(lot.remaining_quantity)
    existing.quantity += qty
    existing.cost += qty * Number(lot.cost_per_unit)
    assetMap.set(lot.asset, existing)
  }

  const positions: PositionEntry[] = Array.from(assetMap.entries())
    .map(([asset, { quantity, cost }]) => ({
      asset,
      totalQuantity: quantity,
      totalCost: cost,
      averageCost: quantity > 0 ? cost / quantity : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost)

  return {
    generatedAt: new Date().toISOString(),
    periodEnd: periodEnd.toISOString(),
    positions,
    totalCostBasis: positions.reduce((s, p) => s + p.totalCost, 0),
  }
}
