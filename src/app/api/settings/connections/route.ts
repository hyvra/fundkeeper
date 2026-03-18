import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

  const [{ data: exchanges }, { data: wallets }] = await Promise.all([
    supabase
      .from('exchange_connections')
      .select('id, last_sync_at')
      .eq('org_id', membership.org_id),
    supabase
      .from('wallet_connections')
      .select('id, last_sync_at')
      .eq('org_id', membership.org_id),
  ])

  // Find the most recent sync across all connections
  const allSyncTimes = [
    ...(exchanges ?? []).map((e) => e.last_sync_at),
    ...(wallets ?? []).map((w) => w.last_sync_at),
  ].filter(Boolean) as string[]

  const lastSync = allSyncTimes.length > 0
    ? allSyncTimes.sort().reverse()[0]
    : null

  return NextResponse.json({
    exchanges: exchanges?.length ?? 0,
    wallets: wallets?.length ?? 0,
    lastSync,
  })
}
