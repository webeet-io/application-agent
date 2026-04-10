import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) return null
  return data.user
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireApiUser() {
  const user = await getCurrentUser()
  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }),
    }
  }

  return {
    ok: true as const,
    user,
  }
}
