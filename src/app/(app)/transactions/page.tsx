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

const CATEGORY_COLORS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  buy: 'default',
  sell: 'destructive',
  transfer_in: 'secondary',
  transfer_out: 'secondary',
  staking_reward: 'default',
  fee: 'outline',
  unknown: 'outline',
}

export default async function TransactionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  const orgId = membership?.org_id

  const { data: transactions } = orgId
    ? await supabase
        .from('transactions')
        .select('*')
        .eq('org_id', orgId)
        .order('timestamp', { ascending: false })
        .limit(100)
    : { data: [] }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">All synced transactions across your connections.</p>
      </div>

      {(!transactions || transactions.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-lg font-semibold">No transactions yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect an exchange or wallet and sync to see transactions here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions ({transactions.length})</CardTitle>
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
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={CATEGORY_COLORS[tx.category] ?? 'outline'}>
                        {tx.category.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tx.asset}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {tx.amount_usd ? `$${Number(tx.amount_usd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '\u2014'}
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
