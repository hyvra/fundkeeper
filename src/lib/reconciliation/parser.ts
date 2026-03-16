export interface Form1099DAEntry {
  dateAcquired: string | null
  dateSold: string
  asset: string
  quantity: number
  proceeds: number
  costBasis: number
  gainLoss: number
  shortOrLongTerm: string
  rawLine: string
}

export function parse1099DA(csvContent: string): Form1099DAEntry[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  // Find header row (skip comment lines starting with #)
  const dataLines = lines.filter(l => !l.startsWith('#'))
  if (dataLines.length < 2) return []

  const headers = dataLines[0].split(',').map(h => h.trim().toLowerCase())
  const entries: Form1099DAEntry[] = []

  for (let i = 1; i < dataLines.length; i++) {
    const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    if (values.length < headers.length) continue

    const get = (field: string) => {
      const idx = headers.findIndex(h => h.includes(field))
      return idx >= 0 ? values[idx] : ''
    }

    entries.push({
      dateAcquired: get('acquired') || null,
      dateSold: get('sold') || get('disposed') || get('date'),
      asset: get('asset') || get('currency') || get('description') || '',
      quantity: parseFloat(get('quantity') || get('amount') || '0') || 0,
      proceeds: parseFloat(get('proceeds')?.replace(/[$,]/g, '') || '0') || 0,
      costBasis: parseFloat((get('cost') || get('basis'))?.replace(/[$,]/g, '') || '0') || 0,
      gainLoss: parseFloat((get('gain') || get('loss'))?.replace(/[$,]/g, '') || '0') || 0,
      shortOrLongTerm: get('term') || get('holding') || '',
      rawLine: dataLines[i],
    })
  }

  return entries
}
