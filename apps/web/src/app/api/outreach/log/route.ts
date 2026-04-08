import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logOutreachUseCase } from '@/infrastructure/container'
import type { OutreachStatus } from '@/ports/outbound/IOutreachRepositoryPort'

const allowedStatuses: OutreachStatus[] = ['drafted', 'sent', 'follow_up_due']

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

  const applicationId = getString(body, 'applicationId')
  const contactName = getString(body, 'contactName')
  const contactEmail = getString(body, 'contactEmail')
  const status = getOptionalStatus(body, 'status')
  const notes = getOptionalString(body, 'notes')

  if (!applicationId || !contactName || !contactEmail) {
    return NextResponse.json({ error: 'applicationId, contactName, contactEmail are required' }, { status: 400 })
  }

  if (status === 'invalid') {
    return NextResponse.json({ error: 'status must be drafted, sent, or follow_up_due' }, { status: 400 })
  }

  const result = await logOutreachUseCase.execute({
    applicationId,
    userId: authResult.data.user.id,
    contactName,
    contactEmail,
    status: status ?? undefined,
    notes: notes ?? undefined,
  })

  if (!result.success) {
    if (result.error.type === 'not_found') {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ outreach: result.value })
}

function getString(body: unknown, key: string): string | null {
  if (!body || typeof body !== 'object') return null
  const value = (body as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : null
}

function getOptionalString(body: unknown, key: string): string | null {
  if (!body || typeof body !== 'object') return null
  const value = (body as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : null
}

function getOptionalStatus(body: unknown, key: string): OutreachStatus | null | 'invalid' {
  if (!body || typeof body !== 'object') return null
  const value = (body as Record<string, unknown>)[key]
  if (typeof value === 'undefined') return null
  if (typeof value !== 'string') return 'invalid'
  return allowedStatuses.includes(value as OutreachStatus) ? (value as OutreachStatus) : 'invalid'
}
