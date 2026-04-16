import { NextRequest, NextResponse } from 'next/server'
import { discoverCompaniesUseCase } from '@/infrastructure/container'
import { requireApiUser } from '@/modules/auth/server'

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

  const prompt = typeof body === 'object' && body !== null && 'prompt' in body ? (body as { prompt: unknown }).prompt : undefined

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  const result = await discoverCompaniesUseCase.execute(prompt)

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ companies: result.value })
}
