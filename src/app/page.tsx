import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Zap,
  Tags,
  Calculator,
  FileCheck,
  BarChart3,
  FileSpreadsheet,
  ArrowRight,
  Check,
  Link2,
  ListOrdered,
  FileOutput,
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Exchange & Wallet Sync',
    description:
      'Connect Coinbase, Binance, Kraken, Gemini, and on-chain wallets. Transactions flow in automatically.',
  },
  {
    icon: Tags,
    title: 'Auto-Categorization',
    description:
      'Deterministic rules classify buys, sells, transfers, staking rewards, and fees without manual tagging.',
  },
  {
    icon: Calculator,
    title: 'FIFO Cost Basis',
    description:
      'Per-wallet FIFO calculations that handle transfers between your own wallets correctly.',
  },
  {
    icon: FileCheck,
    title: '1099-DA Reconciliation',
    description:
      'Import broker 1099-DAs, match against your records, and surface discrepancies before filing.',
  },
  {
    icon: BarChart3,
    title: 'Position & P&L Reports',
    description:
      'Real-time portfolio views, realized/unrealized gains, and period-over-period performance.',
  },
  {
    icon: FileSpreadsheet,
    title: 'GL Export',
    description:
      'Map transactions to your chart of accounts and export journal entries to QuickBooks or Xero.',
  },
]

const steps = [
  {
    number: '01',
    icon: Link2,
    title: 'Connect your exchanges and wallets',
    description:
      'Add API keys for your exchanges and wallet addresses. Encrypted at rest via Supabase Vault.',
  },
  {
    number: '02',
    icon: ListOrdered,
    title: 'Sync and categorize transactions',
    description:
      'Fundkeeper pulls your full history, deduplicates across sources, and auto-categorizes every transaction.',
  },
  {
    number: '03',
    icon: FileOutput,
    title: 'Export reports to your GL',
    description:
      'Generate cost basis reports, reconcile 1099-DAs, and push journal entries to your general ledger.',
  },
]

const includedFeatures = [
  'Unlimited exchange & wallet connections',
  'Full transaction history sync',
  'Auto-categorization engine',
  'Per-wallet FIFO cost basis',
  '1099-DA reconciliation',
  'Position & P&L reports',
  'QuickBooks & Xero GL export',
  'Email support',
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-semibold tracking-tight">Fundkeeper</span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="px-6 pt-24 pb-20 sm:pt-32 sm:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Back office for emerging crypto funds
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Sync exchanges, track cost basis, reconcile 1099-DAs, and export to your GL
              — all in one place.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="lg" className="gap-2 px-5 text-base">
                  Get Started
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="px-5 text-base">
                  See How It Works
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* Problem Statement */}
        <section className="border-y bg-muted/50 px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-2xl font-medium tracking-tight sm:text-3xl">
              Managing a crypto fund&apos;s books shouldn&apos;t require 5 spreadsheets
              and 3 consultants.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <div>
                <div className="text-3xl font-bold">5+</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Spreadsheets to reconcile across exchanges and wallets
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold">40hrs</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Per quarter spent on manual cost basis calculations
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold">$$$</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Paid to consultants for work software should handle
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="scroll-mt-20 px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to close the books
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Purpose-built for crypto fund managers who need audit-ready records without
                the overhead.
              </p>
            </div>
            <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-xl border bg-card p-6">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <feature.icon className="size-5 text-foreground" />
                  </div>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-y bg-muted/50 px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How it works
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                From connected accounts to GL entries in three steps.
              </p>
            </div>
            <div className="mt-14 grid gap-10 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full border-2 border-foreground/10 bg-background">
                    <step.icon className="size-5 text-foreground" />
                  </div>
                  <div className="mt-4 text-xs font-medium tracking-widest text-muted-foreground uppercase">
                    Step {step.number}
                  </div>
                  <h3 className="mt-2 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              One plan. Everything included. No surprises.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-md rounded-xl border bg-card p-8">
            <div className="text-center">
              <div className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium">
                Early Access
              </div>
              <div className="mt-4 text-4xl font-bold tracking-tight">Free</div>
              <p className="mt-1 text-sm text-muted-foreground">
                during beta
              </p>
            </div>
            <ul className="mt-8 space-y-3">
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link href="/signup" className="block">
                <Button size="lg" className="w-full gap-2 text-base">
                  Get Started
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t bg-muted/50 px-6 py-20 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Stop wrestling with spreadsheets.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Join the beta and get your fund&apos;s back office running in minutes.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <Button size="lg" className="gap-2 px-5 text-base">
                  Get Started
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Fundkeeper. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
