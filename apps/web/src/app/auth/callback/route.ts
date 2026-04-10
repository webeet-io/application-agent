import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const errorDescription = url.searchParams.get('error_description')
  const origin = url.origin

  const loginUrl = new URL('/login', origin)
  const homeUrl = new URL('/', origin)

  if (errorDescription) {
    loginUrl.searchParams.set('error', errorDescription)
    return NextResponse.redirect(loginUrl)
  }

  if (!code) {
    loginUrl.searchParams.set('error', 'Authentication callback is missing the authorization code.')
    return NextResponse.redirect(loginUrl)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    loginUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(homeUrl)
}
