import { NextRequest, NextResponse } from 'next/server'
import type { ATSProvider } from '@ceevee/types'
import { fetchCareerPageJobsUseCase } from '@/infrastructure/container'
import { requireApiUser } from '@/modules/auth/server'
import { isIP } from 'node:net'

// Delivery layer responsibility: parse the HTTP request, call the use case, return a response.
// No business logic here.
export async function POST(request: NextRequest) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

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

  const validated = validatePublicHttpUrl(url)
  if (!validated.ok) {
    return NextResponse.json({ error: validated.reason }, { status: 400 })
  }

  const provider = normalizeProvider(providerRaw)

  const result = await fetchCareerPageJobsUseCase.execute(validated.url, provider)

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

type UrlValidationResult =
  | { ok: true; url: string }
  | { ok: false; reason: string }

function validatePublicHttpUrl(rawUrl: string): UrlValidationResult {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { ok: false, reason: 'invalid url' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'only http/https urls are allowed' }
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'credentials in url are not allowed' }
  }

  const hostname = parsed.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return { ok: false, reason: 'localhost urls are not allowed' }
  }

  if (hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    return { ok: false, reason: 'internal urls are not allowed' }
  }

  const ipVersion = isIP(hostname)
  if (ipVersion === 4 && isPrivateIPv4(hostname)) {
    return { ok: false, reason: 'private ip addresses are not allowed' }
  }

  if (ipVersion === 6 && isPrivateIPv6(hostname)) {
    return { ok: false, reason: 'private ip addresses are not allowed' }
  }

  return { ok: true, url: parsed.toString() }
}

function isPrivateIPv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part))
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return true

  const [a, b] = parts
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  if (a === 198 && (b === 18 || b === 19)) return true
  if (a >= 224) return true

  return false
}

function isPrivateIPv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase()
  if (normalized === '::' || normalized === '::1') return true
  if (normalized.startsWith('fe80')) return true
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  if (normalized.startsWith('ff')) return true

  return false
}
