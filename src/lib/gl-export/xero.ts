import { SupabaseClient } from '@supabase/supabase-js'

export interface XeroExportResult {
  exported: number
  failed: number
  errors: string[]
}

export async function exportToXero(
  supabase: SupabaseClient,
  orgId: string
): Promise<XeroExportResult> {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('org_id', orgId)
    .eq('export_status', 'pending')
    .order('entry_date', { ascending: true })

  if (!entries?.length) {
    return { exported: 0, failed: 0, errors: ['No pending entries to export'] }
  }

  // TODO: Implement Xero OAuth + API integration
  // For V1, mark as exported (simulating)

  const result: XeroExportResult = { exported: 0, failed: 0, errors: [] }

  for (const entry of entries) {
    const { error } = await supabase
      .from('journal_entries')
      .update({
        export_status: 'exported',
        exported_at: new Date().toISOString(),
        export_target: 'xero',
      })
      .eq('id', entry.id)

    if (error) {
      result.failed++
      result.errors.push(`Failed to mark entry ${entry.id}: ${error.message}`)
    } else {
      result.exported++
    }
  }

  return result
}

export function generateXeroImportCSV(
  entries: Array<{
    entry_date: string
    description: string
    debit_account: string
    credit_account: string
    amount: number
  }>
): string {
  const headers =
    '*ContactName,*InvoiceNumber,*InvoiceDate,*DueDate,*Description,*AccountCode,*UnitAmount,*TaxType'
  const rows: string[] = [headers]

  for (const entry of entries) {
    rows.push(
      `Fundkeeper,,${entry.entry_date},${entry.entry_date},"${entry.description}",${entry.debit_account},${entry.amount.toFixed(2)},Tax Exempt`
    )
  }

  return rows.join('\n')
}
