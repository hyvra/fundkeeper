import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddExchangeDialog } from '@/components/connections/add-exchange-dialog'
import { AddWalletDialog } from '@/components/connections/add-wallet-dialog'

const EXCHANGE_LABELS: Record<string, string> = {
  coinbase: 'Coinbase',
  binance: 'Binance',
  kraken: 'Kraken',
  gemini: 'Gemini',
}

const CHAIN_LABELS: Record<string, string> = {
  ethereum: 'Ethereum',
  bitcoin: 'Bitcoin',
  solana: 'Solana',
}

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: '',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  disabled: '',
}

export default async function ConnectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get user's org
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  const orgId = membership?.org_id

  const { data: exchanges } = orgId
    ? await supabase.from('exchange_connections').select('*').eq('org_id', orgId).order('created_at', { ascending: false })
    : { data: [] }

  const { data: wallets } = orgId
    ? await supabase.from('wallet_connections').select('*').eq('org_id', orgId).order('created_at', { ascending: false })
    : { data: [] }

  const hasConnections = (exchanges?.length ?? 0) + (wallets?.length ?? 0) > 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connections</h1>
          <p className="text-muted-foreground">Connect your exchanges and wallets to sync transactions.</p>
        </div>
        <div className="flex gap-2">
          <AddExchangeDialog />
          <AddWalletDialog />
        </div>
      </div>

      {!hasConnections && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-lg font-semibold">No connections yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add an exchange API key or wallet address to start syncing transactions.
            </p>
          </CardContent>
        </Card>
      )}

      {(exchanges?.length ?? 0) > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Exchanges</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exchanges?.map((conn) => (
              <Card key={conn.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">
                    {EXCHANGE_LABELS[conn.exchange] ?? conn.exchange}
                  </CardTitle>
                  <Badge
                    variant={conn.status === 'pending' ? 'secondary' : conn.status === 'disabled' ? 'outline' : 'outline'}
                    className={cn(STATUS_CLASSES[conn.status])}
                  >
                    {conn.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {conn.label && <p className="text-sm text-muted-foreground">{conn.label}</p>}
                  {conn.last_sync_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last synced: {new Date(conn.last_sync_at).toLocaleString()}
                    </p>
                  )}
                  {conn.error_message && (
                    <p className="mt-1 text-xs text-destructive">{conn.error_message}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(wallets?.length ?? 0) > 0 && (
        <div>
          <h2 className="mb-4 text-xl font-semibold">Wallets</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wallets?.map((conn) => (
              <Card key={conn.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">
                    {CHAIN_LABELS[conn.chain] ?? conn.chain}
                  </CardTitle>
                  <Badge
                    variant={conn.status === 'pending' ? 'secondary' : conn.status === 'disabled' ? 'outline' : 'outline'}
                    className={cn(STATUS_CLASSES[conn.status])}
                  >
                    {conn.status}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-xs text-muted-foreground truncate">{conn.address}</p>
                  {conn.label && <p className="mt-1 text-sm text-muted-foreground">{conn.label}</p>}
                  {conn.last_sync_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last synced: {new Date(conn.last_sync_at).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
