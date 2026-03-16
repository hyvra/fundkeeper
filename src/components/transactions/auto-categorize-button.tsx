'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function AutoCategorizeButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ autoApplied: number; suggested: number; total: number } | null>(null)
  const router = useRouter()

  async function handleCategorize() {
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/transactions/categorize', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setResult(data)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleCategorize} disabled={loading} variant="outline" size="sm">
        {loading ? 'Categorizing...' : 'Auto-Categorize'}
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground">
          {result.autoApplied} auto-applied, {result.suggested} suggested out of {result.total}
        </span>
      )}
    </div>
  )
}
