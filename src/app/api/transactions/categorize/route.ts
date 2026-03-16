import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { batchCategorize } from '@/lib/categorization/batch'

export async function POST() {
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

  const result = await batchCategorize(supabase, membership.org_id)
  return NextResponse.json(result)
}
