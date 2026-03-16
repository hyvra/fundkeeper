import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-xl font-bold">Fundkeeper</span>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          Back office for emerging crypto funds
        </h1>
        <p className="max-w-lg text-lg text-muted-foreground">
          Connect exchanges, track cost basis per wallet, reconcile 1099-DAs, and export journal entries. Self-serve. $199/mo.
        </p>
        <Link href="/signup">
          <Button size="lg" className="text-base">Start Free Trial</Button>
        </Link>
      </main>
    </div>
  )
}
