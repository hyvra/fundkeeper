import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Wallet,
  Link,
  ArrowRightLeft,
  CircleAlert,
  CheckCircle2,
  Circle,
} from 'lucide-react'

export default async function DashboardPage() {
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

  // Parallel queries for dashboard stats
  const [
    { data: openLots },
    { data: exchanges },
    { data: wallets },
    { count: transactionCount },
    { count: uncategorizedCount },
    { count: categorizedCount },
    { data: costBasisLots },
    { data: reports },
    { data: recentTransactions },
  ] = orgId
    ? await Promise.all([
        supabase
          .from('cost_basis_lots')
          .select('remaining_quantity, cost_per_unit')
          .eq('org_id', orgId)
          .eq('status', 'open'),
        supabase
          .from('exchange_connections')
          .select('id')
          .eq('org_id', orgId),
        supabase
          .from('wallet_connections')
          .select('id')
          .eq('org_id', orgId),
        supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId),
        supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .eq('category', 'unknown'),
        supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', orgId)
          .neq('category', 'unknown')
          .in('category_source', ['rule', 'user']),
        supabase
          .from('cost_basis_lots')
          .select('id')
          .eq('org_id', orgId)
          .limit(1),
        supabase
          .from('reports')
          .select('id')
          .eq('org_id', orgId)
          .limit(1),
        supabase
          .from('transactions')
          .select('id, timestamp, category, asset, amount, amount_usd, source_type')
          .eq('org_id', orgId)
          .order('timestamp', { ascending: false })
          .limit(5),
      ])
    : [
        { data: [] },
        { data: [] },
        { data: [] },
        { count: 0 },
        { count: 0 },
        { count: 0 },
        { data: [] },
        { data: [] },
        { data: [] },
      ]

  // Calculate total asset value from open lots
  const totalAssetValue = (openLots ?? []).reduce(
    (sum, lot) => sum + Number(lot.remaining_quantity) * Number(lot.cost_per_unit),
    0
  )
  const connectionCount = (exchanges?.length ?? 0) + (wallets?.length ?? 0)

  // Checklist state
  const hasConnections = connectionCount > 0
  const hasSynced = (transactionCount ?? 0) > 0
  const hasCategorized = (categorizedCount ?? 0) > 0
  const hasCostBasis = (costBasisLots?.length ?? 0) > 0
  const hasReport = (reports?.length ?? 0) > 0

  const checklist = [
    { label: 'Connect an exchange or wallet', done: hasConnections, href: '/connections' },
    { label: 'Sync transactions', done: hasSynced, href: '/connections' },
    { label: 'Categorize transactions', done: hasCategorized, href: '/transactions' },
    { label: 'Calculate cost basis', done: hasCostBasis, href: '/cost-basis' },
    { label: 'Generate a report', done: hasReport, href: '/reports' },
  ]

  const allDone = checklist.every((item) => item.done)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Asset Value
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalAssetValue > 0
                ? `$${totalAssetValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '--'}
            </p>
            {(openLots?.length ?? 0) > 0 && (
              <p className="text-xs text-muted-foreground">
                {openLots!.length.toLocaleString()} open lots
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Connections
            </CardTitle>
            <Link className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{connectionCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              {(exchanges?.length ?? 0)} exchange{(exchanges?.length ?? 0) !== 1 ? 's' : ''},{' '}
              {(wallets?.length ?? 0)} wallet{(wallets?.length ?? 0) !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transactions
            </CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(transactionCount ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              total synced
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Uncategorized
            </CardTitle>
            <CircleAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(uncategorizedCount ?? 0).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">
              need review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Checklist */}
      {!allDone && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm">
                  {item.done ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <span className={item.done ? 'text-muted-foreground line-through' : ''}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      {(recentTransactions?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">USD Value</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions!.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.category === 'unknown' ? 'outline' : 'secondary'}>
                        {tx.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tx.asset}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {tx.amount_usd
                        ? `$${Number(tx.amount_usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '\u2014'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {tx.source_type}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
