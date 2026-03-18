'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { org_name: orgName } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      setError('Check your email for a confirmation link.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#09090b] px-4 text-[#fafafa]">
      {/* Dot grid background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Gradient glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 z-0 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-500/[0.07] via-cyan-500/[0.04] to-transparent blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-emerald-400 to-cyan-400">
            <span className="text-sm font-bold text-[#09090b]">F</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Fundkeeper</span>
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="mt-1 text-sm text-[#a1a1aa]">
              Start managing your fund&apos;s back office
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="orgName" className="text-sm text-[#a1a1aa]">
                Fund Name
              </Label>
              <Input
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="My Crypto Fund"
                required
                className="border-white/[0.1] bg-white/[0.05] text-white placeholder:text-[#52525b] focus-visible:ring-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-[#a1a1aa]">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@fund.com"
                required
                className="border-white/[0.1] bg-white/[0.05] text-white placeholder:text-[#52525b] focus-visible:ring-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-[#a1a1aa]">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="border-white/[0.1] bg-white/[0.05] text-white placeholder:text-[#52525b] focus-visible:ring-emerald-500/40"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-[#09090b] transition-all hover:shadow-[0_0_24px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:hover:shadow-none"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#71717a]">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-[#a1a1aa] underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
