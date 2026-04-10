import { NextRequest, NextResponse } from 'next/server'
import { advanceOnboardingChatUseCase } from '@/infrastructure/container'
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

  const action =
    typeof payload === 'object' &&
    payload !== null &&
    'action' in payload &&
    (payload.action === 'kickoff' || payload.action === 'reply')
      ? payload.action
      : null

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  if (!action) {
    return NextResponse.json({ error: 'action must be kickoff or reply' }, { status: 400 })
  }

  const result =
    action === 'kickoff'
      ? await advanceOnboardingChatUseCase.execute({
          userId: auth.user.id,
          sessionId: sessionId as never,
          action,
        })
      : await advanceOnboardingChatUseCase.execute({
          userId: auth.user.id,
          sessionId: sessionId as never,
          action,
          message:
            typeof payload === 'object' &&
            payload !== null &&
            'message' in payload &&
            typeof payload.message === 'string'
              ? payload.message
              : '',
        })

  if (!result.success) {
    if (result.error.type === 'invalid_input' || result.error.type === 'invalid_session') {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json(result.value, { status: 200 })
}
