import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { draftOutreachEmailUseCase } from '@/infrastructure/container'

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

  const jobTitle = getString(body, 'jobTitle')
  const jobDescription = getString(body, 'jobDescription')
  const companyName = getString(body, 'companyName')
  const companyContext = getOptionalString(body, 'companyContext')
  const resumeHighlights = getString(body, 'resumeHighlights')
  const contactName = getString(body, 'contactName')
  const contactTitle = getString(body, 'contactTitle')

  if (!jobTitle || !jobDescription || !companyName || !resumeHighlights || !contactName || !contactTitle) {
    return NextResponse.json(
      { error: 'jobTitle, jobDescription, companyName, resumeHighlights, contactName, contactTitle are required' },
      { status: 400 },
    )
  }

  const result = await draftOutreachEmailUseCase.execute({
    jobTitle,
    jobDescription,
    companyName,
    companyContext: companyContext ?? undefined,
    resumeHighlights,
    contactName,
    contactTitle,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ draft: result.value })
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
