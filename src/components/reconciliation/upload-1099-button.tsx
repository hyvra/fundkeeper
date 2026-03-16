'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Upload1099Button() {
  const [loading, setLoading] = useState(false)
  const [taxYear, setTaxYear] = useState(String(new Date().getFullYear() - 1))
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const csvContent = await file.text()
      await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent,
          taxYear: parseInt(taxYear),
          filename: file.name,
        }),
      })
      router.refresh()
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs">Tax Year</Label>
        <Input
          type="number"
          value={taxYear}
          onChange={(e) => setTaxYear(e.target.value)}
          className="w-[100px]"
          min="2020"
          max="2030"
        />
      </div>
      <div>
        <Button onClick={() => fileRef.current?.click()} disabled={loading}>
          {loading ? 'Uploading...' : 'Upload 1099-DA CSV'}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          onChange={handleUpload}
          className="hidden"
          disabled={loading}
        />
      </div>
    </div>
  )
}
