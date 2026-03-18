import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncConnection } from '@/lib/sync/engine'
import { ExchangeName } from '@/types/exchange'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('[cron-sync] CRON_SECRET environment variable is not set')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const errors: string[] = []
  let synced = 0
  let failed = 0

  // Fetch all active exchange connections
  const { data: exchangeConnections, error: exchangeError } = await supabase
    .from('exchange_connections')
    .select('*')
    .in('status', ['active', 'pending'])

  if (exchangeError) {
    console.error('[cron-sync] Failed to fetch exchange connections:', exchangeError.message)
    return NextResponse.json({ error: 'Failed to fetch exchange connections' }, { status: 500 })
  }

  // Fetch all active/pending wallet connections
  const { data: walletConnections, error: walletError } = await supabase
    .from('wallet_connections')
    .select('*')
    .in('status', ['active', 'pending'])

  if (walletError) {
    console.error('[cron-sync] Failed to fetch wallet connections:', walletError.message)
    return NextResponse.json({ error: 'Failed to fetch wallet connections' }, { status: 500 })
  }

  console.log(
    `[cron-sync] Starting sync: ${exchangeConnections?.length ?? 0} exchange connections, ${walletConnections?.length ?? 0} wallet connections`
  )

  // Sync exchange connections
  for (const connection of exchangeConnections ?? []) {
    try {
      console.log(`[cron-sync] Syncing exchange connection ${connection.id} (${connection.exchange})`)

      // Retrieve API keys from Supabase Vault
      const { data: secrets, error: vaultError } = await supabase
        .rpc('get_connection_secrets', { connection_id: connection.id })

      if (vaultError || !secrets || secrets.length === 0) {
        const msg = `Exchange ${connection.id} (${connection.exchange}): Vault not configured or no secrets found — ${vaultError?.message ?? 'no secrets returned'}`
        console.warn(`[cron-sync] ${msg}`)
        errors.push(msg)
        failed++

        await supabase
          .from('exchange_connections')
          .update({
            status: 'error',
            error_message: 'API keys not found in Vault',
          })
          .eq('id', connection.id)

        continue
      }

      const credentials = {
        apiKey: secrets[0].api_key,
        apiSecret: secrets[0].api_secret,
        passphrase: secrets[0].passphrase ?? undefined,
      }

      const report = await syncConnection(supabase, {
        connectionId: connection.id,
        connectionType: 'exchange',
        exchange: connection.exchange as ExchangeName,
        credentials,
        orgId: connection.org_id,
        cursor: connection.sync_cursor ?? undefined,
      })

      if (report.errors.length > 0) {
        const msg = `Exchange ${connection.id} (${connection.exchange}): ${report.errors.join('; ')}`
        console.warn(`[cron-sync] Partial failure: ${msg}`)
        errors.push(msg)
        failed++
      } else {
        console.log(
          `[cron-sync] Exchange ${connection.id} synced: ${report.tradesInserted} trades, ${report.transfersInserted} transfers, ${report.duplicatesSkipped} duplicates skipped`
        )
        synced++
      }
    } catch (err) {
      const msg = `Exchange ${connection.id} (${connection.exchange}): ${err instanceof Error ? err.message : String(err)}`
      console.error(`[cron-sync] Error: ${msg}`)
      errors.push(msg)
      failed++

      try {
        await supabase
          .from('exchange_connections')
          .update({
            status: 'error',
            error_message: err instanceof Error ? err.message : String(err),
          })
          .eq('id', connection.id)
      } catch (updateErr) {
        console.error(`[cron-sync] Failed to update error status for ${connection.id}:`, updateErr)
      }
    }
  }

  // Sync wallet connections
  for (const connection of walletConnections ?? []) {
    try {
      console.log(`[cron-sync] Syncing wallet connection ${connection.id} (${connection.chain})`)

      const report = await syncConnection(supabase, {
        connectionId: connection.id,
        connectionType: 'wallet',
        chain: connection.chain,
        address: connection.address,
        orgId: connection.org_id,
        cursor: connection.sync_cursor ?? undefined,
      })

      if (report.errors.length > 0) {
        const msg = `Wallet ${connection.id} (${connection.chain}): ${report.errors.join('; ')}`
        console.warn(`[cron-sync] Partial failure: ${msg}`)
        errors.push(msg)
        failed++
      } else {
        console.log(
          `[cron-sync] Wallet ${connection.id} synced: ${report.tradesInserted} trades, ${report.transfersInserted} transfers`
        )
        synced++
      }

      // Update last_sync_at for wallet connections
      await supabase
        .from('wallet_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connection.id)
    } catch (err) {
      const msg = `Wallet ${connection.id} (${connection.chain}): ${err instanceof Error ? err.message : String(err)}`
      console.error(`[cron-sync] Error: ${msg}`)
      errors.push(msg)
      failed++

      try {
        await supabase
          .from('wallet_connections')
          .update({
            status: 'error',
            error_message: err instanceof Error ? err.message : String(err),
          })
          .eq('id', connection.id)
      } catch (updateErr) {
        console.error(`[cron-sync] Failed to update error status for ${connection.id}:`, updateErr)
      }
    }
  }

  console.log(`[cron-sync] Complete: ${synced} synced, ${failed} failed`)

  return NextResponse.json({ synced, failed, errors })
}
