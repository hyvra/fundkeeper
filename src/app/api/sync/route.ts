import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSecret } from '@/lib/supabase/vault'
import { syncConnection } from '@/lib/sync'
import { ExchangeName } from '@/types/exchange'
import { ChainName } from '@/types/blockchain'

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

    if (!connection.api_key_id || !connection.api_secret_id) {
      return NextResponse.json({
        error: 'Connection is missing API credentials. Please reconnect with valid API keys.',
      }, { status: 400 })
    }

    // Retrieve API credentials from Vault
    let apiKey: string
    let apiSecret: string
    let passphrase: string | undefined

    try {
      apiKey = await getSecret(connection.api_key_id)
      apiSecret = await getSecret(connection.api_secret_id)

      if (connection.passphrase_id) {
        passphrase = await getSecret(connection.passphrase_id)
      }
    } catch (err) {
      return NextResponse.json({
        error: `Failed to retrieve credentials: ${err instanceof Error ? err.message : 'Unknown error'}`,
      }, { status: 500 })
    }

    // Run sync
    const report = await syncConnection(supabase, {
      connectionId,
      connectionType: 'exchange',
      exchange: connection.exchange as ExchangeName,
      credentials: { apiKey, apiSecret, passphrase },
      orgId: membership.org_id,
      cursor: connection.sync_cursor as Record<string, unknown> | undefined,
    })

    return NextResponse.json({ report })
  }

  if (connectionType === 'wallet') {
    const { data: connection } = await supabase
      .from('wallet_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('org_id', membership.org_id)
      .single()

    if (!connection) {
      return NextResponse.json({ error: 'Wallet connection not found' }, { status: 404 })
    }

    // Wallet adapters use public APIs — no Vault keys needed
    const report = await syncConnection(supabase, {
      connectionId,
      connectionType: 'wallet',
      chain: connection.chain as ChainName,
      address: connection.address,
      orgId: membership.org_id,
      cursor: connection.sync_cursor as Record<string, unknown> | undefined,
    })

    return NextResponse.json({ report })
  }

  return NextResponse.json({ error: 'Invalid connectionType' }, { status: 400 })
}
