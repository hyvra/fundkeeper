'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sparkles,
  Link2,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Wallet,
} from 'lucide-react'

const STEPS = [
  { label: 'Welcome', icon: Sparkles },
  { label: 'Connect', icon: Link2 },
  { label: 'Sync', icon: RefreshCw },
  { label: 'Done', icon: CheckCircle2 },
] as const

const EXCHANGES = [
  { value: 'coinbase', label: 'Coinbase' },
  { value: 'binance', label: 'Binance' },
  { value: 'kraken', label: 'Kraken' },
  { value: 'gemini', label: 'Gemini' },
]

const CHAINS = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'bitcoin', label: 'Bitcoin' },
  { value: 'solana', label: 'Solana' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)

  function goNext() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0))
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
      <div className="mx-auto w-full max-w-2xl space-y-8 px-4">
        <StepIndicator currentStep={step} />
        {step === 0 && <WelcomeStep onNext={goNext} />}
        {step === 1 && <ConnectStep onNext={goNext} onBack={goBack} />}
        {step === 2 && <SyncStep onNext={goNext} onBack={goBack} />}
        {step === 3 && <DoneStep />}
      </div>
    </div>
  )
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((s, i) => {
        const Icon = s.icon
        const isActive = i === currentStep
        const isCompleted = i < currentStep
        return (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ' +
                  (isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : isCompleted
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/30 text-muted-foreground/50')
                }
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>
              <span
                className={
                  'text-xs font-medium ' +
                  (isActive
                    ? 'text-foreground'
                    : isCompleted
                      ? 'text-primary'
                      : 'text-muted-foreground/50')
                }
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={
                  'mx-3 mb-5 h-0.5 w-12 transition-colors ' +
                  (i < currentStep ? 'bg-primary' : 'bg-muted-foreground/20')
                }
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to Fundkeeper</CardTitle>
        <CardDescription className="text-base">
          Your crypto fund back-office in a few steps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          We&apos;ll help you get set up quickly. Here&apos;s what to expect:
        </p>
        <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">Connect</strong> an exchange or wallet so
            Fundkeeper can see your activity.
          </li>
          <li>
            <strong className="text-foreground">Sync</strong> your transaction history to
            start building your subledger.
          </li>
          <li>
            <strong className="text-foreground">Done</strong> — from there you can categorize
            transactions, calculate cost basis, reconcile, and export.
          </li>
        </ol>
        <p className="text-sm text-muted-foreground">
          Don&apos;t have your API keys handy? No problem — you can skip any step and set things
          up later from the Connections page.
        </p>
        <div className="flex justify-end pt-2">
          <Button onClick={onNext} size="lg">
            Get started
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ConnectStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [tab, setTab] = useState<'exchange' | 'wallet'>('exchange')
  const [exchange, setExchange] = useState('')
  const [label, setLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [chain, setChain] = useState('')
  const [address, setAddress] = useState('')
  const [walletLabel, setWalletLabel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleExchangeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/connections/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange,
          label,
          apiKey,
          apiSecret,
          passphrase: passphrase || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to add connection')
      }

      setSuccess(`${EXCHANGES.find((ex) => ex.value === exchange)?.label ?? 'Exchange'} connected successfully.`)
      setExchange('')
      setLabel('')
      setApiKey('')
      setApiSecret('')
      setPassphrase('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleWalletSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/connections/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chain,
          address,
          label: walletLabel || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to add wallet')
      }

      setSuccess(`${CHAINS.find((c) => c.value === chain)?.label ?? 'Wallet'} wallet added successfully.`)
      setChain('')
      setAddress('')
      setWalletLabel('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect an Exchange or Wallet</CardTitle>
        <CardDescription>
          Add your first connection. You can always add more later.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}
        {success && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            {success}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant={tab === 'exchange' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('exchange')}
          >
            <Link2 className="mr-1 h-4 w-4" />
            Exchange
          </Button>
          <Button
            variant={tab === 'wallet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('wallet')}
          >
            <Wallet className="mr-1 h-4 w-4" />
            Wallet
          </Button>
        </div>

        {tab === 'exchange' && (
          <form onSubmit={handleExchangeSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label>Exchange</Label>
              <Select value={exchange} onValueChange={(v) => setExchange(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exchange" />
                </SelectTrigger>
                <SelectContent>
                  {EXCHANGES.map((ex) => (
                    <SelectItem key={ex.value} value={ex.value}>
                      {ex.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-label">Label (optional)</Label>
              <Input
                id="onboard-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Trading Account"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-api-key">API Key</Label>
              <Input
                id="onboard-api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-api-secret">API Secret</Label>
              <Input
                id="onboard-api-secret"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                required
              />
            </div>
            {exchange === 'coinbase' && (
              <div className="space-y-2">
                <Label htmlFor="onboard-passphrase">Passphrase</Label>
                <Input
                  id="onboard-passphrase"
                  type="password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                />
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !exchange || !apiKey || !apiSecret}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Exchange'
              )}
            </Button>
          </form>
        )}

        {tab === 'wallet' && (
          <form onSubmit={handleWalletSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label>Chain</Label>
              <Select value={chain} onValueChange={(v) => setChain(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  {CHAINS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-address">Address</Label>
              <Input
                id="onboard-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="0x..."
                required
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboard-wallet-label">Label (optional)</Label>
              <Input
                id="onboard-wallet-label"
                value={walletLabel}
                onChange={(e) => setWalletLabel(e.target.value)}
                placeholder="e.g. Cold Storage"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !chain || !address}>
              {loading ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Wallet'
              )}
            </Button>
          </form>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <button
              onClick={onNext}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Skip for now
            </button>
            <Button onClick={onNext}>
              Next
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SyncStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    setSyncError(null)

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Sync failed')
      }

      const data = await res.json()
      const count = data.transactionsImported ?? data.count ?? 0
      setSyncResult(
        count > 0
          ? `Synced ${count} transaction${count === 1 ? '' : 's'} successfully.`
          : 'Sync complete. No new transactions found — this is normal if no connections have been added yet.'
      )
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sync Your Data</CardTitle>
        <CardDescription>
          Pull transaction history from your connected exchanges and wallets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {syncError && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {syncError}
          </div>
        )}
        {syncResult && (
          <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
            {syncResult}
          </div>
        )}

        <div className="flex flex-col items-center gap-4 py-6">
          <RefreshCw
            className={
              'h-12 w-12 text-muted-foreground' + (syncing ? ' animate-spin' : '')
            }
          />
          <p className="text-center text-sm text-muted-foreground">
            {syncing
              ? 'Syncing your transaction history...'
              : 'Click below to pull in your latest transactions.'}
          </p>
          <Button onClick={handleSync} disabled={syncing} size="lg">
            {syncing ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-1 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <button
              onClick={onNext}
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              Skip for now
            </button>
            <Button onClick={onNext}>
              Next
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DoneStep() {
  const router = useRouter()
  const [completing, setCompleting] = useState(false)

  async function handleComplete() {
    setCompleting(true)
    try {
      await fetch('/api/onboarding/complete', { method: 'POST' })
    } catch {
      // Non-critical — user can still proceed
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle className="text-2xl">You&apos;re all set</CardTitle>
        <CardDescription className="text-base">
          Fundkeeper is ready to go. You can always add more connections, sync data, and
          configure settings from the sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center pt-2">
          <Button onClick={handleComplete} size="lg" disabled={completing}>
            {completing ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Go to Dashboard'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
