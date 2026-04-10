'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BarChart3, Mail, MailCheck, Search, Zap } from 'lucide-react'
import logo from '@/assets/logo.png'

const FEATURES = [
  { Icon: Zap, label: 'Instant job matching based on your profile' },
  { Icon: Search, label: 'Smart company discovery tailored to you' },
  { Icon: BarChart3, label: 'AI-powered skill gap analysis & guidance' },
]

const RIPPLE_RINGS = [180, 280, 380, 490]

type Status = 'idle' | 'google-loading' | 'magic-loading' | 'magic-sent'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function LoginForm({ initialError }: { initialError?: string | null }) {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    setError(initialError ?? null)
  }, [initialError])

  const isBusy = status === 'google-loading' || status === 'magic-loading'

  async function handleGoogleSignIn() {
    setStatus('google-loading')
    setError(null)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (authError) {
      setStatus('idle')
      setError(authError.message)
    }
    // On success the browser navigates away — status stays 'google-loading'
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setStatus('magic-loading')
    setError(null)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      })
      if (authError) {
        setStatus('idle')
        setError(authError.message)
      } else {
        setStatus('magic-sent')
      }
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="flex min-h-screen font-sans">
      {/* ── Left: Brand panel ── */}
      <div className="relative hidden overflow-hidden bg-[#2d3855] text-white lg:flex lg:w-[480px] lg:shrink-0 lg:flex-col lg:p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-[460px] w-[460px] rounded-full bg-[#69bc8c]/22 blur-[130px]" />
          <div className="absolute -bottom-24 -left-24 h-[380px] w-[380px] rounded-full bg-[#a45674]/18 blur-[110px]" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle, rgba(255,255,255,0.85) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
          {RIPPLE_RINGS.map((size, i) => (
            <div
              key={size}
              className="absolute rounded-full border border-white"
              style={{
                width: size,
                height: size,
                right: -(size / 2),
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.14 - i * 0.028,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Image src={logo} alt="CeeVee" width={36} height={36} className="rounded-xl" />
          <span className="text-base font-semibold tracking-tight">CeeVee</span>
        </div>

        <div className="relative z-10 mt-auto">
          <h1 className="text-[2.1rem] font-bold leading-[1.18] tracking-tight">
            Your AI-powered<br />career companion
          </h1>
          <p className="mt-4 max-w-[300px] text-sm leading-relaxed text-white/65">
            Discover opportunities, match your skills, and get personalised guidance — all in one place.
          </p>
          <div className="mt-8 space-y-3">
            {FEATURES.map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/10">
                  <Icon className="h-3.5 w-3.5 text-white/80" />
                </div>
                <span className="text-sm text-white/75">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 mt-12 text-xs text-white/30">
          © {new Date().getFullYear()} CeeVee · Built for the modern job seeker
        </p>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-16">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <Image src={logo} alt="CeeVee" width={32} height={32} className="rounded-lg" />
          <span className="text-sm font-semibold">CeeVee</span>
        </div>

        <div className="w-full max-w-[360px]">
          {status === 'magic-sent' ? (
            /* ── Sent confirmation ── */
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
                <MailCheck className="h-6 w-6 text-primary" strokeWidth={1.75} />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Check your inbox</h2>
              <p className="mt-2 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
                We sent a sign-in link to{' '}
                <span className="font-medium text-foreground">{email}</span>.
                {' '}Click it to sign in — no password needed.
              </p>
              <p className="mt-2 text-xs text-muted-foreground/70">
                Didn&apos;t get it? Check your spam folder.
              </p>
              <button
                type="button"
                className="mt-6 text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                onClick={() => { setStatus('idle'); setEmail('') }}
              >
                Try a different email
              </button>
            </div>
          ) : (
            /* ── Sign-in form ── */
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Sign in to your CeeVee workspace
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Google */}
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full gap-2.5 text-sm"
                onClick={handleGoogleSignIn}
                disabled={isBusy}
              >
                <GoogleLogo />
                {status === 'google-loading' ? 'Redirecting…' : 'Continue with Google'}
              </Button>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Magic link */}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="magic-email">Email address</Label>
                  <Input
                    id="magic-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isBusy}
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  className="h-11 w-full gap-2.5 text-sm"
                  disabled={isBusy}
                >
                  <Mail className="h-4 w-4" strokeWidth={1.75} />
                  {status === 'magic-loading' ? 'Sending link…' : 'Send magic link'}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-muted-foreground/60">
                By continuing, you agree to our{' '}
                <span className="cursor-pointer underline underline-offset-3 hover:text-muted-foreground">
                  Terms
                </span>{' '}
                and{' '}
                <span className="cursor-pointer underline underline-offset-3 hover:text-muted-foreground">
                  Privacy Policy
                </span>
                .
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
