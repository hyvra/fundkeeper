import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mapTransactionsToJournalEntries } from '@/lib/gl-export/mapper'
import {
  exportToQuickBooks,
  generateQBImportCSV,
} from '@/lib/gl-export/quickbooks'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json(
      { error: 'No organization found' },
      { status: 404 }
    )
  }

  // First, map any new transactions to journal entries
  const mapResult = await mapTransactionsToJournalEntries(
    supabase,
    membership.org_id
  )

  // Then export pending entries
  const exportResult = await exportToQuickBooks(supabase, membership.org_id)

  return NextResponse.json({ mapResult, exportResult })
}

export async function GET() {
  // Generate CSV download
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json(
      { error: 'No organization found' },
      { status: 404 }
    )
  }

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('entry_date, description, debit_account, credit_account, amount')
    .eq('org_id', membership.org_id)
    .order('entry_date', { ascending: true })

  const csv = generateQBImportCSV(entries ?? [])

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition':
        'attachment; filename="fundkeeper-quickbooks-export.csv"',
    },
  })
}
