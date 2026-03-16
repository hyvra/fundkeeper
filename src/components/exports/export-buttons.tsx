'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function ExportButtons() {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function handleExport(target: 'quickbooks' | 'xero') {
    setLoading(target)
    try {
      await fetch(`/api/export/${target}`, { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  async function handleDownload(target: 'quickbooks' | 'xero') {
    const res = await fetch(`/api/export/${target}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fundkeeper-${target}-export.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleExport('quickbooks')}
        disabled={loading !== null}
      >
        {loading === 'quickbooks' ? 'Exporting...' : 'Export to QuickBooks'}
      </Button>
      <Button
        variant="outline"
        onClick={() => handleDownload('quickbooks')}
      >
        Download QB CSV
      </Button>
      <Button
        onClick={() => handleExport('xero')}
        disabled={loading !== null}
        variant="secondary"
      >
        {loading === 'xero' ? 'Exporting...' : 'Export to Xero'}
      </Button>
      <Button
        variant="outline"
        onClick={() => handleDownload('xero')}
      >
        Download Xero CSV
      </Button>
    </div>
  )
}
