import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { storeSecret, deleteSecret } from '@/lib/supabase/vault'

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
  const { exchange, label, apiKey, apiSecret, passphrase } = body

  if (!exchange || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const validExchanges = ['coinbase', 'binance', 'kraken', 'gemini']
  if (!validExchanges.includes(exchange)) {
    return NextResponse.json({ error: 'Invalid exchange' }, { status: 400 })
  }

  // Store API credentials in Supabase Vault
  const storedSecretIds: string[] = []

  let apiKeyId: string
  let apiSecretId: string
  let passphraseId: string | null = null

  try {
    apiKeyId = await storeSecret(`${exchange}_api_key`, apiKey)
    storedSecretIds.push(apiKeyId)

    apiSecretId = await storeSecret(`${exchange}_api_secret`, apiSecret)
    storedSecretIds.push(apiSecretId)

    if (passphrase) {
      passphraseId = await storeSecret(`${exchange}_passphrase`, passphrase)
      storedSecretIds.push(passphraseId)
    }
  } catch (err) {
    // Clean up any secrets that were stored before the failure
    for (const id of storedSecretIds) {
      try {
        await deleteSecret(id)
      } catch {
        // Best-effort cleanup
      }
    }
    return NextResponse.json({
      error: `Failed to store credentials: ${err instanceof Error ? err.message : 'Unknown error'}`,
    }, { status: 500 })
  }

  // Insert connection with vault secret IDs
  const { data, error } = await supabase
    .from('exchange_connections')
    .insert({
      org_id: membership.org_id,
      exchange,
      label: label ?? '',
      api_key_id: apiKeyId,
      api_secret_id: apiSecretId,
      passphrase_id: passphraseId,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    // Clean up vault secrets if connection insert fails
    for (const id of storedSecretIds) {
      try {
        await deleteSecret(id)
      } catch {
        // Best-effort cleanup
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ connection: data })
}
