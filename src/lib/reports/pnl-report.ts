import { SupabaseClient } from '@supabase/supabase-js'

export interface PnlEntry {
  asset: string
  shortTermGain: number
  shortTermLoss: number
  longTermGain: number
  longTermLoss: number
  netGainLoss: number
  disposalCount: number
}

export interface PnlReport {
  generatedAt: string
  periodStart: string
  periodEnd: string
  entries: PnlEntry[]
  totals: {
    shortTermGain: number
    shortTermLoss: number
    longTermGain: number
    longTermLoss: number
    netGainLoss: number
    totalDisposals: number
  }
}

export async function generatePnlReport(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<PnlReport> {
  const { data: disposals } = await supabase
    .from('disposals')
    .select('asset, quantity, gain_loss, holding_period, disposed_at')
    .eq('org_id', orgId)
    .gte('disposed_at', periodStart.toISOString())
    .lte('disposed_at', periodEnd.toISOString())

  const assetMap = new Map<string, PnlEntry>()

  for (const d of disposals ?? []) {
    const existing = assetMap.get(d.asset) ?? {
      asset: d.asset,
      shortTermGain: 0,
      shortTermLoss: 0,
      longTermGain: 0,
      longTermLoss: 0,
      netGainLoss: 0,
      disposalCount: 0,
    }

    const gl = Number(d.gain_loss)
    if (d.holding_period === 'short_term') {
      if (gl >= 0) existing.shortTermGain += gl
      else existing.shortTermLoss += gl
    } else {
      if (gl >= 0) existing.longTermGain += gl
      else existing.longTermLoss += gl
    }
    existing.netGainLoss += gl
    existing.disposalCount++
    assetMap.set(d.asset, existing)
  }

  const entries = Array.from(assetMap.values()).sort(
    (a, b) => Math.abs(b.netGainLoss) - Math.abs(a.netGainLoss)
  )

  const totals = entries.reduce(
    (acc, e) => ({
      shortTermGain: acc.shortTermGain + e.shortTermGain,
      shortTermLoss: acc.shortTermLoss + e.shortTermLoss,
      longTermGain: acc.longTermGain + e.longTermGain,
      longTermLoss: acc.longTermLoss + e.longTermLoss,
      netGainLoss: acc.netGainLoss + e.netGainLoss,
      totalDisposals: acc.totalDisposals + e.disposalCount,
    }),
    {
      shortTermGain: 0,
      shortTermLoss: 0,
      longTermGain: 0,
      longTermLoss: 0,
      netGainLoss: 0,
      totalDisposals: 0,
    }
  )

  return {
    generatedAt: new Date().toISOString(),
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    entries,
    totals,
  }
}
