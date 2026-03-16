import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { RecalculateButton } from '@/components/cost-basis/recalculate-button'

export default async function CostBasisPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  const orgId = membership?.org_id

  // Fetch lots
  const { data: lots } = orgId
    ? await supabase
        .from('cost_basis_lots')
        .select('*')
        .eq('org_id', orgId)
        .order('acquired_at', { ascending: true })
        .limit(200)
    : { data: [] }

  // Fetch disposals with gain/loss summary
  const { data: disposals } = orgId
    ? await supabase
        .from('disposals')
        .select('*')
        .eq('org_id', orgId)
        .order('disposed_at', { ascending: false })
        .limit(200)
    : { data: [] }

  // Calculate summaries
  const totalGain = (disposals ?? [])
    .filter(d => Number(d.gain_loss) >= 0)
    .reduce((sum, d) => sum + Number(d.gain_loss), 0)
  const totalLoss = (disposals ?? [])
    .filter(d => Number(d.gain_loss) < 0)
    .reduce((sum, d) => sum + Number(d.gain_loss), 0)
  const netGainLoss = totalGain + totalLoss
  const openLots = (lots ?? []).filter(l => l.status === 'open')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cost Basis</h1>
          <p className="text-muted-foreground">Per-wallet FIFO cost basis tracking.</p>
        </div>
        <RecalculateButton />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Lots</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{openLots.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Realized Gains</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              ${totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Realized Losses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              ${Math.abs(totalLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Gain/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${netGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {netGainLoss >= 0 ? '' : '-'}${Math.abs(netGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Open Lots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Open Lots ({openLots.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {openLots.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No open lots. Sync transactions and calculate cost basis to see lots here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Acquired</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">Cost/Unit</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openLots.map((lot) => (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">{lot.asset}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(lot.acquired_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(lot.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {Number(lot.remaining_quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${Number(lot.cost_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${Number(lot.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">open</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Disposals Table */}
      {(disposals?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Disposals ({disposals?.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Proceeds</TableHead>
                  <TableHead className="text-right">Cost Basis</TableHead>
                  <TableHead className="text-right">Gain/Loss</TableHead>
                  <TableHead>Holding</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disposals?.map((d) => {
                  const gl = Number(d.gain_loss)
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.asset}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(d.disposed_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {Number(d.quantity).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${Number(d.total_proceeds).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        ${Number(d.cost_basis).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`text-right font-mono text-sm ${gl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {gl >= 0 ? '+' : ''}${gl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.holding_period === 'long_term' ? 'default' : 'secondary'}>
                          {d.holding_period === 'long_term' ? 'Long' : 'Short'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
