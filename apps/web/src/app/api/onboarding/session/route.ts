import { NextRequest, NextResponse } from 'next/server'
import { startOrResumeOnboardingSessionUseCase } from '@/infrastructure/container'
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

  const startStep =
    typeof payload === 'object' &&
    payload !== null &&
    'startStep' in payload &&
    (payload.startStep === 'resume_upload' || payload.startStep === 'guided_chat')
      ? payload.startStep
      : null

  if (!startStep) {
    return NextResponse.json(
      { error: 'startStep must be either resume_upload or guided_chat' },
      { status: 400 },
    )
  }

  const result = await startOrResumeOnboardingSessionUseCase.execute({
    userId: auth.user.id,
    startStep,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ session: result.value }, { status: 200 })
}
