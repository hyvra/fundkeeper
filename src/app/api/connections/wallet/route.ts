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
  const { chain, address, label } = body

  if (!chain || !address) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const validChains = ['ethereum', 'bitcoin', 'solana']
  if (!validChains.includes(chain)) {
    return NextResponse.json({ error: 'Invalid chain' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('wallet_connections')
    .insert({
      org_id: membership.org_id,
      chain,
      address,
      label: label ?? '',
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'This wallet address is already connected' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ connection: data })
}
