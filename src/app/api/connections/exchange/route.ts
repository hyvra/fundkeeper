import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await request.json()
  const { exchange, label, apiKey, apiSecret } = body

  if (!exchange || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const validExchanges = ['coinbase', 'binance', 'kraken', 'gemini']
  if (!validExchanges.includes(exchange)) {
    return NextResponse.json({ error: 'Invalid exchange' }, { status: 400 })
  }

  // TODO: In production, store API keys in Supabase Vault
  // For now, store connection without keys (keys will be added when Vault is configured)
  const { data, error } = await supabase
    .from('exchange_connections')
    .insert({
      org_id: membership.org_id,
      exchange,
      label: label ?? '',
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ connection: data })
}
