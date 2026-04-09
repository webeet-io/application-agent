'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function readHashParams() {
  if (typeof window === 'undefined') {
    return null
  }

  const fragment = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash

  if (!fragment) {
    return null
  }

  const params = new URLSearchParams(fragment)
  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')

  if (!accessToken || !refreshToken) {
    return null
  }

  return { accessToken, refreshToken }
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState('Signing you in...')

  useEffect(() => {
    let cancelled = false

    async function completeSignIn() {
      const supabase = createClient()
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else {
          const tokens = readHashParams()
          if (!tokens) {
            throw new Error('The authentication callback did not include a code or session tokens.')
          }

          const { error } = await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
          })
          if (error) throw error
        }

        window.location.replace('/')
      } catch (error) {
        if (cancelled) return

        setMessage(
          error instanceof Error
            ? `Authentication failed: ${error.message}`
            : 'Authentication failed. Please try signing in with Google again.',
        )
      }
    }

    void completeSignIn()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12 md:px-8">
      <div className="w-full max-w-[560px] rounded-[28px] border border-[rgba(71,53,40,0.12)] bg-[rgba(255,252,248,0.88)] p-6 text-center shadow-[0_28px_80px_rgba(65,46,32,0.14)] backdrop-blur-[18px]">
        <p className="m-0 text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[#8a735f]">
          Authentication
        </p>
        <h1 className="mt-2 mb-0 text-[clamp(2rem,4vw,3rem)] leading-[0.95] text-[#221914]">
          Completing sign-in
        </h1>
        <p className="mt-4 mb-0 text-[1rem] leading-[1.55] text-[#5e4e43]">{message}</p>
      </div>
    </main>
  )
}
