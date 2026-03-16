import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePositionReport } from '@/lib/reports/position-report'
import { generatePnlReport } from '@/lib/reports/pnl-report'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json(
      { error: 'No organization found' },
      { status: 404 }
    )
  }

  const body = await request.json()
  const { reportType, periodStart, periodEnd } = body

  if (!reportType) {
    return NextResponse.json({ error: 'Missing reportType' }, { status: 400 })
  }

  let reportData: unknown

  if (reportType === 'position') {
    reportData = await generatePositionReport(
      supabase,
      membership.org_id,
      periodEnd ? new Date(periodEnd) : new Date()
    )
  } else if (reportType === 'pnl') {
    if (!periodStart || !periodEnd) {
      return NextResponse.json(
        { error: 'P&L report requires periodStart and periodEnd' },
        { status: 400 }
      )
    }
    reportData = await generatePnlReport(
      supabase,
      membership.org_id,
      new Date(periodStart),
      new Date(periodEnd)
    )
  } else {
    return NextResponse.json(
      { error: 'Invalid reportType' },
      { status: 400 }
    )
  }

  // Save to reports table
  const { error } = await supabase.from('reports').insert({
    org_id: membership.org_id,
    report_type: reportType,
    period_start: periodStart ?? new Date().toISOString().slice(0, 10),
    period_end: periodEnd ?? new Date().toISOString().slice(0, 10),
    report_data: reportData,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(reportData)
}
