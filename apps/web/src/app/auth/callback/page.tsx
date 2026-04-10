'use client'

// Client-side PKCE exchange. The code verifier is stored in the browser's
// cookies by createBrowserClient when signInWithOtp is called. Reading it
// here via document.cookie (not request headers) avoids every hostname-
// mismatch and cookie-transport issue that a server-side route handler has.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const errorDescription = params.get('error_description')

    if (errorDescription) {
      router.replace(`/login?error=${encodeURIComponent(errorDescription)}`)
      return
    }

    if (!code) {
      router.replace('/login?error=Authentication+callback+is+missing+the+authorization+code.')
      return
    }

    createClient()
      .auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) {
          router.replace(`/login?error=${encodeURIComponent(error.message)}`)
        } else {
          router.replace('/')
        }
      })
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}
