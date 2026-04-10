import { NextRequest, NextResponse } from 'next/server'
import { completeOnboardingUseCase } from '@/infrastructure/container'
import { requireApiUser } from '@/modules/auth/server'

export async function POST(request: NextRequest) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid json payload' }, { status: 400 })
  }

  const sessionId =
    typeof payload === 'object' &&
    payload !== null &&
    'sessionId' in payload &&
    typeof payload.sessionId === 'string'
      ? payload.sessionId.trim()
      : ''

  const force =
    typeof payload === 'object' && payload !== null && 'force' in payload && payload.force === true

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  const result = await completeOnboardingUseCase.execute({
    userId: auth.user.id,
    sessionId: sessionId as never,
    force,
  })

  if (!result.success) {
    if (
      result.error.type === 'invalid_input' ||
      result.error.type === 'invalid_session' ||
      result.error.type === 'not_ready'
    ) {
      return NextResponse.json(
        {
          error: result.error.message,
          preview: result.error.type === 'not_ready' ? result.error.preview : undefined,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json(
    {
      session: result.value.session,
      preview: result.value.preview,
      careerProfile: result.value.careerProfile,
      redirectTo: '/opportunities',
    },
    { status: 200 },
  )
}
