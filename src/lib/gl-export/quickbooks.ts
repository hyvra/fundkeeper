import { SupabaseClient } from '@supabase/supabase-js'

export interface QBExportResult {
  exported: number
  failed: number
  errors: string[]
}

export async function exportToQuickBooks(
  supabase: SupabaseClient,
  orgId: string
): Promise<QBExportResult> {
  // Fetch pending journal entries
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('org_id', orgId)
    .eq('export_status', 'pending')
    .order('entry_date', { ascending: true })

  if (!entries?.length) {
    return { exported: 0, failed: 0, errors: ['No pending entries to export'] }
  }

  // TODO: Implement QuickBooks OAuth + API integration
  // For V1, generate a CSV download format that can be manually imported
  // QuickBooks requires: Date, Journal No., Description, Account, Debit, Credit

  // Mark entries as exported (simulating successful export)
  const result: QBExportResult = { exported: 0, failed: 0, errors: [] }

  for (const entry of entries) {
    const { error } = await supabase
      .from('journal_entries')
      .update({
        export_status: 'exported',
        exported_at: new Date().toISOString(),
        export_target: 'quickbooks',
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

export function generateQBImportCSV(
  entries: Array<{
    entry_date: string
    description: string
    debit_account: string
    credit_account: string
    amount: number
  }>
): string {
  const headers = 'Date,Journal No.,Description,Account,Debit,Credit'
  const rows: string[] = [headers]
  let journalNo = 1

  for (const entry of entries) {
    // Debit line
    rows.push(
      `${entry.entry_date},JE-${String(journalNo).padStart(4, '0')},"${entry.description}",${entry.debit_account},${entry.amount.toFixed(2)},`
    )
    // Credit line
    rows.push(
      `${entry.entry_date},JE-${String(journalNo).padStart(4, '0')},"${entry.description}",${entry.credit_account},,${entry.amount.toFixed(2)}`
    )
    journalNo++
  }

  return rows.join('\n')
}
