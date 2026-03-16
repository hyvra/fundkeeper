import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Upload1099Button } from '@/components/reconciliation/upload-1099-button'

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  matched: 'default',
  pending: 'secondary',
  discrepancy: 'destructive',
  resolved: 'outline',
}

export default async function ReconciliationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  const orgId = membership?.org_id

  const { data: reconciliations } = orgId
    ? await supabase
        .from('reconciliations')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">1099-DA Reconciliation</h1>
          <p className="text-muted-foreground">Upload and reconcile 1099-DA forms against internal records.</p>
        </div>
        <Upload1099Button />
      </div>

      {(!reconciliations || reconciliations.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-lg font-semibold">No reconciliations yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Upload a 1099-DA CSV to reconcile against your transaction records.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tax Year</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Entries</TableHead>
                  <TableHead className="text-right">Matched</TableHead>
                  <TableHead className="text-right">Discrepancies</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.tax_year}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.uploaded_filename ?? '—'}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[r.status] ?? 'secondary'}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{r.total_entries}</TableCell>
                    <TableCell className="text-right">{r.matched_count}</TableCell>
                    <TableCell className="text-right">{r.discrepancy_count}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
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
