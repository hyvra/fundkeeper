'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function RecalculateButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRecalculate() {
    setLoading(true)
    try {
      await fetch('/api/cost-basis/calculate', { method: 'POST' })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleRecalculate} disabled={loading} variant="outline">
      {loading ? 'Calculating...' : 'Recalculate All'}
    </Button>
  )
}
