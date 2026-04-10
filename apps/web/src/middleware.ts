import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

function isProtectedPath(pathname: string) {
  if (pathname === '/') return true
  if (pathname.startsWith('/api/')) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  if (!isProtectedPath(pathname)) return response

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
