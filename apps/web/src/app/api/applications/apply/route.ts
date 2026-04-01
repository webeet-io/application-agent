import { NextRequest, NextResponse } from 'next/server'
import type { JobId, ResumeId } from '@ceevee/types'
import { markApplicationAppliedUseCase } from '@/infrastructure/container'

// Delivery layer responsibility: parse the HTTP request, call the use case, return a response.
// No business logic here.
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const userId = getString(body, 'userId')
  const jobId = getString(body, 'jobId')
  const resumeId = getString(body, 'resumeId')
  const notes = getOptionalString(body, 'notes')

  if (!userId || !jobId || !resumeId) {
    return NextResponse.json({ error: 'userId, jobId, and resumeId are required' }, { status: 400 })
  }

  const result = await markApplicationAppliedUseCase.execute({
    userId,
    jobId: jobId as JobId,
    resumeId: resumeId as ResumeId,
    notes: notes ?? undefined,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ application: result.value }, { status: 201 })
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
