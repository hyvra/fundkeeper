'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
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
            <h1 className="text-2xl font-bold">Set new password</h1>
            <p className="mt-1 text-sm text-[#a1a1aa]">
              {success
                ? 'Password updated successfully'
                : 'Enter your new password below'}
            </p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400">
                Your password has been updated. Redirecting to sign in...
              </div>
              <p className="text-center text-sm text-[#71717a]">
                <Link
                  href="/login"
                  className="text-[#a1a1aa] underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Go to sign in now
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-[#a1a1aa]">
                  New password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-white/[0.1] bg-white/[0.05] text-white placeholder:text-[#52525b] focus-visible:ring-emerald-500/40"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-sm text-[#a1a1aa]"
                >
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="border-white/[0.1] bg-white/[0.05] text-white placeholder:text-[#52525b] focus-visible:ring-emerald-500/40"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-[#09090b] transition-all hover:shadow-[0_0_24px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:hover:shadow-none"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
