import { NextRequest, NextResponse } from 'next/server'
import type { ApplicationId, ApplicationStatus } from '@ceevee/types'
import { updateApplicationStatusUseCase } from '@/infrastructure/container'
import { createClient } from '@/lib/supabase/server'

// Delivery layer responsibility: parse the HTTP request, call the use case, return a response.
// No business logic here.
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const { id } = await context.params
  const applicationId = id
  if (!applicationId) {
    return NextResponse.json({ error: 'application id is required' }, { status: 400 })
  }

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

  const statusRaw = getString(body, 'status')
  if (!statusRaw) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  const status = normalizeStatus(statusRaw)
  if (!status) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })
  }

  const result = await updateApplicationStatusUseCase.execute(applicationId as ApplicationId, authResult.data.user.id, status)

  if (!result.success) {
    if (result.error.type === 'not_found') {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }
    if (result.error.type === 'unsupported_outcome') {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}

function normalizeStatus(value: string | null): ApplicationStatus | null {
  if (!value) return null

  const normalized = value.toLowerCase()
  const allowed: ApplicationStatus[] = [
    'saved',
    'applied',
    'interview',
    'rejected',
    'offer',
    'withdrawn',
  ]

  return allowed.includes(normalized as ApplicationStatus) ? (normalized as ApplicationStatus) : null
}

function getString(body: unknown, key: string): string | null {
  if (!body || typeof body !== 'object') return null
  const value = (body as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : null
}
