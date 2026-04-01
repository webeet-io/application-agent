import { NextRequest, NextResponse } from 'next/server'
import type { ApplicationId } from '@ceevee/types'
import { updateApplicationStatusUseCase } from '@/infrastructure/container'
import type { ApplicationOutcome } from '@/application/UpdateApplicationStatusUseCase'

// Delivery layer responsibility: parse the HTTP request, call the use case, return a response.
// No business logic here.
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const applicationId = context.params.id
  if (!applicationId) {
    return NextResponse.json({ error: 'application id is required' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const statusRaw = getString(body, 'status')
  const status = normalizeStatus(statusRaw)

  if (!status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  const result = await updateApplicationStatusUseCase.execute(applicationId as ApplicationId, status)

  if (!result.success) {
    if (result.error.type === 'not_found') {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}

function normalizeStatus(value: string | null): ApplicationOutcome | null {
  if (!value) return null

  const normalized = value.toLowerCase()
  const allowed: ApplicationOutcome[] = [
    'saved',
    'applied',
    'interview',
    'rejected',
    'offer',
    'withdrawn',
    'no_response',
  ]

  return allowed.includes(normalized as ApplicationOutcome) ? (normalized as ApplicationOutcome) : null
}

function getString(body: unknown, key: string): string | null {
  if (!body || typeof body !== 'object') return null
  const value = (body as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : null
}
