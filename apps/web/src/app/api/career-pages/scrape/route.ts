import { NextRequest, NextResponse } from 'next/server'
import type { ATSProvider } from '@ceevee/types'
import { fetchCareerPageJobsUseCase } from '@/infrastructure/container'

// Delivery layer responsibility: parse the HTTP request, call the use case, return a response.
// No business logic here.
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const url = typeof body === 'object' && body !== null && 'url' in body ? (body as { url: unknown }).url : undefined
  const providerRaw = typeof body === 'object' && body !== null && 'provider' in body
    ? (body as { provider: unknown }).provider
    : undefined

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const provider = normalizeProvider(providerRaw)

  const result = await fetchCareerPageJobsUseCase.execute(url, provider)

  if (!result.success) {
    if (result.error.type === 'ats_not_supported') {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json(result.value)
}

function normalizeProvider(value: unknown): ATSProvider | undefined {
  if (!value || typeof value !== 'string') return undefined

  const normalized = value.toLowerCase()
  const allowed: ATSProvider[] = [
    'greenhouse',
    'lever',
    'workday',
    'ashby',
    'personio',
    'softgarden',
    'dvinci',
    'unknown',
  ]

  return allowed.includes(normalized as ATSProvider) ? (normalized as ATSProvider) : undefined
}
