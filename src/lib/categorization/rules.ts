interface CategoryResult {
  category: string
  confidence: number
}

interface TransactionInput {
  source_type: 'exchange' | 'wallet'
  asset: string
  amount: number
  counter_asset: string | null
  counter_amount: number | null
  fee_amount: number
  fee_asset: string | null
  from_address: string | null
  to_address: string | null
  tx_hash: string | null
  category: string // current category (may be 'unknown')
  notes: string | null
  raw_data?: Record<string, unknown>
}

// Rule 1: Exchange buy/sell — if counter_asset exists, it's a trade
function ruleTrade(tx: TransactionInput): CategoryResult | null {
  if (tx.counter_asset && tx.counter_amount) {
    // If we have a counter asset, this is a trade
    // amount > 0 with counter = buy, amount < 0 = sell
    // But typically the normalizer already tags these correctly
    if (tx.amount > 0) {
      return { category: 'buy', confidence: 0.95 }
    } else {
      return { category: 'sell', confidence: 0.95 }
    }
  }
  return null
}

// Rule 2: Fiat deposit/withdrawal — USD, EUR, GBP movements
function ruleFiat(tx: TransactionInput): CategoryResult | null {
  const fiatCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF']
  if (fiatCurrencies.includes(tx.asset.toUpperCase())) {
    if (tx.amount > 0) {
      return { category: 'fiat_deposit', confidence: 0.95 }
    } else {
      return { category: 'fiat_withdrawal', confidence: 0.95 }
    }
  }
  return null
}

// Rule 3: Transfer detection — has tx_hash or addresses, no counter asset
function ruleTransfer(tx: TransactionInput): CategoryResult | null {
  if (!tx.counter_asset && (tx.tx_hash || tx.from_address || tx.to_address)) {
    if (tx.amount > 0) {
      return { category: 'transfer_in', confidence: 0.8 }
    } else {
      return { category: 'transfer_out', confidence: 0.8 }
    }
  }
  return null
}

// Rule 4: Fee detection — very small amounts relative to nothing, or fee_asset matches asset
function ruleFee(tx: TransactionInput): CategoryResult | null {
  if (tx.fee_amount > 0 && tx.amount === 0 && !tx.counter_asset) {
    return { category: 'fee', confidence: 0.9 }
  }
  return null
}

// Rule 5: Staking reward — keyword detection in notes or raw data
function ruleStakingReward(tx: TransactionInput): CategoryResult | null {
  const keywords = ['staking', 'reward', 'stake', 'validator', 'delegation']
  const searchText = [
    tx.notes,
    tx.raw_data ? JSON.stringify(tx.raw_data) : '',
  ].join(' ').toLowerCase()

  if (keywords.some(k => searchText.includes(k)) && tx.amount > 0) {
    return { category: 'staking_reward', confidence: 0.85 }
  }
  return null
}

// Rule 6: Interest income — keyword detection
function ruleInterest(tx: TransactionInput): CategoryResult | null {
  const keywords = ['interest', 'earn', 'lending', 'yield', 'apy']
  const searchText = [
    tx.notes,
    tx.raw_data ? JSON.stringify(tx.raw_data) : '',
  ].join(' ').toLowerCase()

  if (keywords.some(k => searchText.includes(k)) && tx.amount > 0) {
    return { category: 'interest', confidence: 0.8 }
  }
  return null
}

// Rules in priority order
const RULES = [
  ruleFiat,
  ruleFee,
  ruleStakingReward,
  ruleInterest,
  ruleTrade,
  ruleTransfer,
]

export function categorizeTransaction(tx: TransactionInput): CategoryResult {
  for (const rule of RULES) {
    const result = rule(tx)
    if (result) return result
  }
  return { category: 'unknown', confidence: 0 }
}

export function shouldAutoApply(confidence: number): boolean {
  return confidence > 0.9
}

export function shouldSuggest(confidence: number): boolean {
  return confidence >= 0.5 && confidence <= 0.9
}

export type { TransactionInput, CategoryResult }
