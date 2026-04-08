import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOutreachEmailsUseCase } from '@/infrastructure/container'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const authResult = await supabase.auth.getUser()
  if (authResult.error || !authResult.data.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const emails = getStringArray(body, 'emails')
  if (!emails || emails.length === 0) {
    return NextResponse.json({ error: 'emails is required' }, { status: 400 })
  }

  const result = await validateOutreachEmailsUseCase.execute(emails)
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ validated: result.value })
}

function getStringArray(body: unknown, key: string): string[] | null {
  if (!body || typeof body !== 'object') return null
  const value = (body as Record<string, unknown>)[key]
  if (!Array.isArray(value)) return null
  const filtered = value.filter((item) => typeof item === 'string') as string[]
  return filtered.length === value.length ? filtered : null
}
