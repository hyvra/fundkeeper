import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateCostBasis, calculateAllAssets } from '@/lib/cost-basis'

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

  const body = await request.json().catch(() => ({}))
  const { asset } = body

  if (asset) {
    const result = await calculateCostBasis(supabase, membership.org_id, asset)
    return NextResponse.json(result)
  } else {
    const results = await calculateAllAssets(supabase, membership.org_id)
    return NextResponse.json(results)
  }
}
