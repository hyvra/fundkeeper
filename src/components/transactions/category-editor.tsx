'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const CATEGORIES = [
  { value: 'buy', label: 'Buy' },
  { value: 'sell', label: 'Sell' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
  { value: 'staking_reward', label: 'Staking Reward' },
  { value: 'interest', label: 'Interest' },
  { value: 'income', label: 'Income' },
  { value: 'fee', label: 'Fee' },
  { value: 'chain_split', label: 'Chain Split' },
  { value: 'gift_in', label: 'Gift In' },
  { value: 'gift_out', label: 'Gift Out' },
  { value: 'fiat_deposit', label: 'Fiat Deposit' },
  { value: 'fiat_withdrawal', label: 'Fiat Withdrawal' },
  { value: 'unknown', label: 'Unknown' },
]

interface CategoryEditorProps {
  transactionId: string
  currentCategory: string
}

export function CategoryEditor({ transactionId, currentCategory }: CategoryEditorProps) {
  const [updating, setUpdating] = useState(false)
  const router = useRouter()

  async function handleChange(newCategory: string | null) {
    if (!newCategory || newCategory === currentCategory) return
    setUpdating(true)

    const supabase = createClient()
    await supabase
      .from('transactions')
      .update({
        category: newCategory,
        category_confidence: 1.0,
        category_source: 'user',
      })
      .eq('id', transactionId)

    setUpdating(false)
    router.refresh()
  }

  return (
    <Select value={currentCategory} onValueChange={handleChange} disabled={updating}>
      <SelectTrigger className="h-7 w-[140px] text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map((cat) => (
          <SelectItem key={cat.value} value={cat.value}>
            {cat.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
