'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  async function handleGoogleSignIn() {
    setStatus('loading')
    setMessage(null)

    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
      return
    }
  }

  return (
    <div className="grid gap-4 rounded-[28px] border border-[rgba(71,53,40,0.12)] bg-[rgba(255,252,248,0.88)] p-6 shadow-[0_28px_80px_rgba(65,46,32,0.14)] backdrop-blur-[18px]">
      <div className="grid gap-2">
        <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#8a735f]">
          Authentication
        </p>
        <h1 className="m-0 text-[clamp(2.3rem,5vw,4.4rem)] leading-[0.95] text-[#221914]">
          Sign in to CeeVee
        </h1>
        <p className="m-0 max-w-[34rem] text-[1rem] leading-[1.55] text-[#5e4e43]">
          Continue with your Google account to open your protected workspace.
        </p>
      </div>

      <button
        type="button"
        className="flex items-center justify-center gap-3 rounded-full bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] px-5 py-3 font-bold text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] transition duration-150 hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={status === 'loading'}
        onClick={handleGoogleSignIn}
      >
        <span className="text-[1rem] leading-none">G</span>
        <span>{status === 'loading' ? 'Redirecting to Google...' : 'Continue with Google'}</span>
      </button>

      {message ? (
        <p className="m-0 rounded-[18px] border border-[rgba(159,47,36,0.15)] bg-[rgba(255,243,240,0.92)] px-4 py-3 text-[0.95rem] text-[#9f2f24]">
          {message}
        </p>
      ) : null}
    </div>
  )
}
