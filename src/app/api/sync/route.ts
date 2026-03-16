import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { connectionId, connectionType } = body

  if (!connectionId || !connectionType) {
    return NextResponse.json({ error: 'Missing connectionId or connectionType' }, { status: 400 })
  }

  // Verify user has access to this connection
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  if (connectionType === 'exchange') {
    const { data: connection } = await supabase
      .from('exchange_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('org_id', membership.org_id)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // TODO: Retrieve API keys from Supabase Vault and run sync
    // For now, return a message that Vault needs to be configured
    return NextResponse.json({
      error: 'Sync requires Supabase Vault configuration for API key storage. Set up Vault to enable syncing.',
      connection: connection
    }, { status: 501 })
  }

  return NextResponse.json({ error: 'Wallet sync not yet implemented' }, { status: 501 })
}
