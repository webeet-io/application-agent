import { NextRequest, NextResponse } from 'next/server'
import type { SkillGapStrategyMode } from '@/domain/mentor-skill-gap'
import { generateSkillGapPlanUseCase } from '@/infrastructure/container'
import { requireApiUser } from '@/modules/auth/server'

// Delivery layer only — no business logic here.
// Auth, extract userId + optional override, call use case, return result.
export async function POST(request: NextRequest) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  const strategyModeOverride =
    typeof body === 'object' && body !== null && 'strategyModeOverride' in body
      ? normalizeStrategyMode((body as { strategyModeOverride: unknown }).strategyModeOverride)
      : undefined

  const result = await generateSkillGapPlanUseCase.execute({
    userId: auth.user.id,
    strategyModeOverride,
  })

  if (!result.success) {
    const status =
      result.error.type === 'preferences_not_found' ||
      result.error.type === 'resume_not_found' ||
      result.error.type === 'resume_signals_missing'
        ? 422
        : 502

    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json(result.value)
}

const VALID_STRATEGY_MODES: SkillGapStrategyMode[] = ['get_hired_quickly', 'long_term_growth', 'balanced']

function normalizeStrategyMode(value: unknown): SkillGapStrategyMode | undefined {
  if (typeof value !== 'string') return undefined
  return VALID_STRATEGY_MODES.includes(value as SkillGapStrategyMode)
    ? (value as SkillGapStrategyMode)
    : undefined
}
