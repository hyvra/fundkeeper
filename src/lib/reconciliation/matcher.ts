import { SupabaseClient } from '@supabase/supabase-js'
import { Form1099DAEntry } from './parser'

export interface MatchResult {
  entry: Form1099DAEntry
  status: 'matched' | 'unmatched' | 'discrepancy'
  disposalId?: string
  internalProceeds?: number
  internalCostBasis?: number
  internalGainLoss?: number
  discrepancyDetails?: string
}

const QUANTITY_TOLERANCE = 0.0001 // 0.01%
const AMOUNT_TOLERANCE = 0.01 // $0.01

export async function matchReconciliation(
  supabase: SupabaseClient,
  orgId: string,
  entries: Form1099DAEntry[]
): Promise<MatchResult[]> {
  // Fetch all disposals
  const { data: disposals } = await supabase
    .from('disposals')
    .select('id, asset, disposed_at, quantity, total_proceeds, cost_basis, gain_loss, holding_period')
    .eq('org_id', orgId)
    .order('disposed_at', { ascending: true })

  if (!disposals) return entries.map(e => ({ entry: e, status: 'unmatched' as const }))

  const usedDisposals = new Set<string>()
  const results: MatchResult[] = []

  for (const entry of entries) {
    let bestMatch: (typeof disposals)[0] | null = null
    let bestScore = 0

    for (const d of disposals) {
      if (usedDisposals.has(d.id)) continue

      // Asset match (normalize)
      const entryAsset = entry.asset.toUpperCase().replace(/[^A-Z]/g, '')
      const disposalAsset = d.asset.toUpperCase().replace(/[^A-Z]/g, '')
      if (entryAsset !== disposalAsset) continue

      // Date match (same day)
      const entryDate = new Date(entry.dateSold).toISOString().slice(0, 10)
      const disposalDate = new Date(d.disposed_at).toISOString().slice(0, 10)
      if (entryDate !== disposalDate) continue

      // Quantity match (within tolerance)
      const qtyDiff = Math.abs(entry.quantity - Number(d.quantity)) / Math.max(entry.quantity, Number(d.quantity), 1)
      if (qtyDiff > QUANTITY_TOLERANCE) continue

      // Score: closer quantity = better match
      const score = 1 - qtyDiff
      if (score > bestScore) {
        bestScore = score
        bestMatch = d
      }
    }

    if (bestMatch) {
      usedDisposals.add(bestMatch.id)

      const proceedsDiff = Math.abs(entry.proceeds - Number(bestMatch.total_proceeds))
      const costDiff = Math.abs(entry.costBasis - Number(bestMatch.cost_basis))
      const glDiff = Math.abs(entry.gainLoss - Number(bestMatch.gain_loss))

      const hasDiscrepancy = proceedsDiff > AMOUNT_TOLERANCE || costDiff > AMOUNT_TOLERANCE || glDiff > AMOUNT_TOLERANCE

      const discrepancies: string[] = []
      if (proceedsDiff > AMOUNT_TOLERANCE) discrepancies.push(`Proceeds: 1099=$${entry.proceeds}, internal=$${Number(bestMatch.total_proceeds).toFixed(2)}`)
      if (costDiff > AMOUNT_TOLERANCE) discrepancies.push(`Cost basis: 1099=$${entry.costBasis}, internal=$${Number(bestMatch.cost_basis).toFixed(2)}`)
      if (glDiff > AMOUNT_TOLERANCE) discrepancies.push(`Gain/Loss: 1099=$${entry.gainLoss}, internal=$${Number(bestMatch.gain_loss).toFixed(2)}`)

      results.push({
        entry,
        status: hasDiscrepancy ? 'discrepancy' : 'matched',
        disposalId: bestMatch.id,
        internalProceeds: Number(bestMatch.total_proceeds),
        internalCostBasis: Number(bestMatch.cost_basis),
        internalGainLoss: Number(bestMatch.gain_loss),
        discrepancyDetails: discrepancies.length > 0 ? discrepancies.join('; ') : undefined,
      })
    } else {
      results.push({
        entry,
        status: 'unmatched',
      })
    }
  }

  return results
}
