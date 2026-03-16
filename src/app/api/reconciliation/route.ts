import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parse1099DA } from '@/lib/reconciliation/parser'
import { matchReconciliation } from '@/lib/reconciliation/matcher'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  const body = await request.json()
  const { csvContent, taxYear, filename } = body

  if (!csvContent || !taxYear) {
    return NextResponse.json({ error: 'Missing csvContent or taxYear' }, { status: 400 })
  }

  // Parse CSV
  const entries = parse1099DA(csvContent)
  if (entries.length === 0) {
    return NextResponse.json({ error: 'No valid entries found in CSV' }, { status: 400 })
  }

  // Match against internal disposals
  const matchResults = await matchReconciliation(supabase, membership.org_id, entries)

  const matchedCount = matchResults.filter(r => r.status === 'matched').length
  const discrepancyCount = matchResults.filter(r => r.status === 'discrepancy').length

  // Save reconciliation record
  const { data: recon, error } = await supabase
    .from('reconciliations')
    .insert({
      org_id: membership.org_id,
      tax_year: taxYear,
      status: discrepancyCount > 0 ? 'discrepancy' : 'matched',
      uploaded_filename: filename ?? null,
      uploaded_data: entries,
      match_results: matchResults,
      total_entries: entries.length,
      matched_count: matchedCount,
      discrepancy_count: discrepancyCount,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    reconciliationId: recon.id,
    totalEntries: entries.length,
    matched: matchedCount,
    discrepancies: discrepancyCount,
    unmatched: entries.length - matchedCount - discrepancyCount,
    results: matchResults,
  })
}
