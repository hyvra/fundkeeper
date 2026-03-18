import Link from 'next/link'
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
  Shield,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Exchange & Wallet Sync',
    description:
      'Pulls trades from Coinbase, Binance, Kraken, and Gemini via API. Grabs on-chain transactions too. No CSV uploads.',
  },
  {
    icon: Tags,
    title: 'Auto-Categorization',
    description:
      'Buys, sells, transfers, staking rewards, fees — tagged automatically by deterministic rules. You fix edge cases, not everything.',
  },
  {
    icon: Calculator,
    title: 'FIFO Cost Basis',
    description:
      'Per-wallet FIFO that actually handles transfers between your own wallets without double-counting. The thing spreadsheets get wrong.',
  },
  {
    icon: FileCheck,
    title: '1099-DA Reconciliation',
    description:
      'Upload your broker 1099-DAs, match them against your records, and see exactly where they disagree. Before you file.',
  },
  {
    icon: BarChart3,
    title: 'Position & P&L Reports',
    description:
      'See your positions, realized and unrealized gains, and performance by period. The stuff your LPs actually ask for.',
  },
  {
    icon: FileSpreadsheet,
    title: 'GL Export',
    description:
      'Map to your chart of accounts and export journal entries as CSV for QuickBooks or Xero. No re-keying.',
  },
]

const steps = [
  {
    number: '01',
    icon: Link2,
    title: 'Connect',
    description:
      'Add API keys and wallet addresses. Encrypted at rest — we never see them in plaintext.',
  },
  {
    number: '02',
    icon: ListOrdered,
    title: 'Sync',
    description:
      'Full transaction history pulls in, gets deduplicated, and auto-categorized. You review, not rebuild.',
  },
  {
    number: '03',
    icon: FileOutput,
    title: 'Export',
    description:
      'Cost basis, 1099-DA reconciliation, journal entries to QuickBooks or Xero. Done.',
  },
]

const includedFeatures = [
  'All exchanges and wallets, no limits',
  'Full transaction history, not just recent',
  'Auto-categorization for every transaction',
  'Per-wallet FIFO cost basis',
  '1099-DA matching and discrepancy reports',
  'Position and P&L reports',
  'GL export to QuickBooks and Xero',
  'Email support from people who get crypto accounting',
]

export default function LandingPage() {
  return (
    <div className="landing-page flex min-h-screen flex-col bg-[#09090b] text-[#fafafa]">
      {/* Dot grid background */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-cyan-400">
              <span className="text-sm font-bold text-[#09090b]">F</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Fundkeeper</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-[#a1a1aa] transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#09090b] transition-all hover:bg-white/90"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pt-28 pb-20 sm:pt-40 sm:pb-32">
          {/* Gradient glow behind hero */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-gradient-to-b from-emerald-500/[0.07] via-cyan-500/[0.05] to-transparent blur-3xl" />

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-sm text-[#a1a1aa]">
              <span className="inline-block size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Now in beta — free for early users
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Your fund&apos;s books.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Done.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#a1a1aa] sm:text-xl">
              Crypto fund accounting for managers who&apos;d rather run their fund
              than fight spreadsheets at quarter-end.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-7 py-3.5 text-base font-semibold text-[#09090b] transition-all hover:shadow-[0_0_32px_rgba(16,185,129,0.3)]"
              >
                Get Started Free
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] px-7 py-3.5 text-base font-medium text-[#a1a1aa] transition-colors hover:border-white/[0.2] hover:text-white"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Product mock */}
          <div className="relative mx-auto mt-20 max-w-5xl">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1.5 shadow-2xl shadow-black/50 backdrop-blur-sm">
              <div className="rounded-xl bg-[#111113] overflow-hidden">
                {/* Window chrome */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-white/[0.08]" />
                    <div className="size-2.5 rounded-full bg-white/[0.08]" />
                    <div className="size-2.5 rounded-full bg-white/[0.08]" />
                  </div>
                  <div className="ml-4 flex-1 rounded-md bg-white/[0.04] px-3 py-1 text-xs text-[#52525b]">
                    fundkeeper.vercel.app/dashboard
                  </div>
                </div>
                {/* Dashboard content */}
                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-4">
                    {[
                      { label: 'Total Asset Value', value: '$2,847,291', sub: '142 open lots' },
                      { label: 'Connections', value: '7', sub: '4 exchanges, 3 wallets' },
                      { label: 'Transactions', value: '3,291', sub: 'total synced' },
                      { label: 'Uncategorized', value: '12', sub: 'need review' },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
                      >
                        <div className="text-xs text-[#71717a]">{card.label}</div>
                        <div className="mt-1 text-xl font-bold">{card.value}</div>
                        <div className="mt-0.5 text-xs text-[#52525b]">{card.sub}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mini transaction table */}
                  <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    <div className="border-b border-white/[0.06] px-4 py-2.5 text-sm font-medium">Recent Transactions</div>
                    <div className="divide-y divide-white/[0.04]">
                      {[
                        { date: 'Mar 15', cat: 'buy', asset: 'BTC', amount: '0.5000', usd: '$31,247.50' },
                        { date: 'Mar 14', cat: 'sell', asset: 'ETH', amount: '12.0000', usd: '$22,140.00' },
                        { date: 'Mar 14', cat: 'transfer_in', asset: 'SOL', amount: '250.0000', usd: '$8,750.00' },
                        { date: 'Mar 13', cat: 'staking_reward', asset: 'ETH', amount: '0.0312', usd: '$57.41' },
                      ].map((tx) => (
                        <div key={tx.date + tx.asset} className="flex items-center px-4 py-2 text-sm">
                          <span className="w-20 text-[#52525b]">{tx.date}</span>
                          <span className={`w-28 rounded px-1.5 py-0.5 text-xs font-medium ${
                            tx.cat === 'buy' ? 'bg-emerald-500/10 text-emerald-400' :
                            tx.cat === 'sell' ? 'bg-red-500/10 text-red-400' :
                            tx.cat === 'staking_reward' ? 'bg-purple-500/10 text-purple-400' :
                            'bg-cyan-500/10 text-cyan-400'
                          }`}>{tx.cat.replace('_', ' ')}</span>
                          <span className="w-16 font-medium">{tx.asset}</span>
                          <span className="flex-1 text-right font-mono text-[#a1a1aa]">{tx.amount}</span>
                          <span className="w-28 text-right font-mono text-[#a1a1aa]">{tx.usd}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Fade-out gradient at bottom of mock */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#09090b] to-transparent" />
          </div>
        </section>

        {/* Problem Statement */}
        <section className="relative px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-2xl font-medium leading-snug tracking-tight text-[#e4e4e7] sm:text-3xl lg:text-4xl">
              You know the drill. Five spreadsheets, three consultants,
              and you&apos;re still not sure the numbers are right.
            </p>
            <div className="mx-auto mt-16 grid max-w-2xl gap-8 sm:grid-cols-3">
              {[
                { stat: '5+', desc: 'spreadsheets duct-taped together across exchanges and wallets' },
                { stat: '40hrs', desc: 'every quarter on cost basis math that should be automatic' },
                { stat: '$$$', desc: 'to consultants for work that belongs in software' },
              ].map((item) => (
                <div key={item.stat} className="group">
                  <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    {item.stat}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[#71717a]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="scroll-mt-20 px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                What it actually does
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[#71717a]">
                Built for funds in the $5-50M range who need real books, not another
                dashboard.
              </p>
            </div>
            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 ring-1 ring-white/[0.06]">
                    <feature.icon className="size-5 text-emerald-400" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#71717a]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="relative px-6 py-24 sm:py-32">
          {/* Subtle glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />
          <div className="relative mx-auto max-w-4xl">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Three steps. That&apos;s it.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[#71717a]">
                Connected accounts to journal entries. No onboarding calls, no
                implementation timeline.
              </p>
            </div>
            <div className="mt-16 grid gap-0 sm:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.number} className="relative flex flex-col items-center px-8 py-8 text-center">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className="absolute top-14 right-0 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-white/[0.1] to-transparent sm:block" />
                  )}
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 ring-1 ring-white/[0.08]">
                    <step.icon className="size-6 text-emerald-400" />
                  </div>
                  <div className="mt-5 text-xs font-medium tracking-[0.2em] text-emerald-400/60 uppercase">
                    Step {step.number}
                  </div>
                  <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#71717a]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust / Why */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: 'Vault-encrypted credentials',
                  description: 'API keys stored in Supabase Vault with pgsodium encryption. We can\'t read them even if we wanted to.',
                },
                {
                  icon: TrendingUp,
                  title: 'IRS Rev. Proc. 2024-28',
                  description: 'FIFO calculations follow the latest IRS guidance for digital asset reporting. Audit-ready from day one.',
                },
                {
                  icon: ArrowUpRight,
                  title: 'Self-serve, no calls',
                  description: 'Sign up, connect, sync. No demo requests, no enterprise sales calls, no "contact us for pricing."',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
                >
                  <item.icon className="size-5 text-[#52525b]" />
                  <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#52525b]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl">
            <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.02]">
              {/* Gradient glow in card */}
              <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-emerald-500/[0.06] blur-3xl" />
              <div className="relative grid gap-10 p-10 sm:grid-cols-2 sm:gap-16 sm:p-16">
                <div>
                  <div className="inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                    Early Access
                  </div>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                    Free while we build
                  </h2>
                  <p className="mt-4 text-[#71717a]">
                    We&apos;re in beta. Everything&apos;s included. You help us find the
                    rough edges, we give you the product for free.
                  </p>
                  <div className="mt-8">
                    <Link
                      href="/signup"
                      className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-7 py-3.5 text-base font-semibold text-[#09090b] transition-all hover:shadow-[0_0_32px_rgba(16,185,129,0.3)]"
                    >
                      Get Started Free
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <ul className="space-y-3">
                    {includedFeatures.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-[#a1a1aa]">
                        <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 py-24 sm:py-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Close the books this quarter
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                without the fire drill.
              </span>
            </h2>
            <p className="mt-4 text-[#71717a]">
              Set up takes about 10 minutes. The beta is free.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-7 py-3.5 text-base font-semibold text-[#09090b] transition-all hover:shadow-[0_0_32px_rgba(16,185,129,0.3)]"
              >
                Get Started Free
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-cyan-400">
              <span className="text-xs font-bold text-[#09090b]">F</span>
            </div>
            <span className="text-sm text-[#52525b]">
              &copy; {new Date().getFullYear()} Fundkeeper
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[#52525b]">
            <Link href="/login" className="transition-colors hover:text-[#a1a1aa]">
              Sign in
            </Link>
            <Link href="/signup" className="transition-colors hover:text-[#a1a1aa]">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
