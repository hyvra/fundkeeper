import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { GenerateReportButton } from '@/components/reports/generate-report-button'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  const orgId = membership?.org_id

  const { data: reports } = orgId
    ? await supabase
        .from('reports')
        .select('*')
        .eq('org_id', orgId)
        .order('generated_at', { ascending: false })
        .limit(20)
    : { data: [] }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate position and P&L reports.</p>
        </div>
        <GenerateReportButton />
      </div>

      {(!reports || reports.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-lg font-semibold">No reports yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate a position or P&L report to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Generated Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((r) => {
                  const data = r.report_data as Record<string, unknown>
                  let summary = ''
                  if (r.report_type === 'position') {
                    const positions = (data?.positions as Array<unknown>) ?? []
                    const total = data?.totalCostBasis as number ?? 0
                    summary = `${positions.length} positions, $${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cost basis`
                  } else if (r.report_type === 'pnl') {
                    const totals = data?.totals as Record<string, number> ?? {}
                    summary = `Net: $${(totals.netGainLoss ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, ${totals.totalDisposals ?? 0} disposals`
                  }
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Badge variant={r.report_type === 'position' ? 'default' : 'secondary'}>
                          {r.report_type === 'position' ? 'Position' : r.report_type === 'pnl' ? 'P&L' : r.report_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {r.period_start} to {r.period_end}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.generated_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">{summary}</TableCell>
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
