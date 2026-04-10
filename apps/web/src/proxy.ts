import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function isPublicPath(pathname: string) {
  if (pathname === '/login') return true
  if (pathname === '/register') return true
  if (pathname.startsWith('/auth/')) return true
  return false
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // If a PKCE code lands on any page outside /auth/, forward it to the
  // callback handler. This happens when Supabase uses a bare origin as
  // redirect_to and appends ?code= to it instead of to /auth/callback.
  const code = request.nextUrl.searchParams.get('code')
  if (code && !pathname.startsWith('/auth/')) {
    const callbackUrl = new URL('/auth/callback', request.url)
    callbackUrl.searchParams.set('code', code)
    return NextResponse.redirect(callbackUrl)
  }

  const { response, user } = await updateSession(request)

  if (isPublicPath(pathname)) return response

  if (user) return response

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
