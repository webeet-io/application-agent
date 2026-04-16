import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiUser } from '@/modules/auth/server'
import { env } from '@/infrastructure/env'
import type { LearningProgressEvent } from '@/domain/mentor-skill-gap'

type ProgressBody = {
  gapName: string
  gapKind: LearningProgressEvent['gapKind']
  eventType: LearningProgressEvent['eventType']
  stepOrder?: number
  evidenceLevel?: LearningProgressEvent['evidenceLevel']
  artifactType?: LearningProgressEvent['artifactType']
  artifactUrl?: string
  details?: string
}

const VALID_GAP_KINDS = ['hard_skill', 'signal', 'experience'] as const
const VALID_EVENT_TYPES = [
  'studied_foundation',
  'completed_guided_exercise',
  'built_project',
  'used_in_real_context',
  'completed_exit_criterion',
  'self_claimed_skill',
  'marked_resume_ready',
  'resume_ready_revoked',
] as const
const VALID_EVIDENCE_LEVELS = ['weak', 'moderate', 'strong'] as const
const VALID_ARTIFACT_TYPES = ['none', 'note', 'project', 'repo', 'portfolio', 'work_sample'] as const

export async function POST(request: NextRequest) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'body must be an object' }, { status: 400 })
  }

  const b = body as Record<string, unknown>

  if (typeof b.gapName !== 'string' || b.gapName.trim().length === 0) {
    return NextResponse.json({ error: 'gapName is required' }, { status: 400 })
  }
  if (!VALID_GAP_KINDS.includes(b.gapKind as LearningProgressEvent['gapKind'])) {
    return NextResponse.json({ error: 'invalid gapKind' }, { status: 400 })
  }
  if (!VALID_EVENT_TYPES.includes(b.eventType as LearningProgressEvent['eventType'])) {
    return NextResponse.json({ error: 'invalid eventType' }, { status: 400 })
  }

  const parsed: ProgressBody = {
    gapName: (b.gapName as string).trim(),
    gapKind: b.gapKind as LearningProgressEvent['gapKind'],
    eventType: b.eventType as LearningProgressEvent['eventType'],
    stepOrder: typeof b.stepOrder === 'number' ? b.stepOrder : undefined,
    evidenceLevel: VALID_EVIDENCE_LEVELS.includes(b.evidenceLevel as LearningProgressEvent['evidenceLevel'])
      ? (b.evidenceLevel as LearningProgressEvent['evidenceLevel'])
      : 'moderate',
    artifactType: VALID_ARTIFACT_TYPES.includes(b.artifactType as LearningProgressEvent['artifactType'])
      ? (b.artifactType as LearningProgressEvent['artifactType'])
      : 'none',
    artifactUrl: typeof b.artifactUrl === 'string' ? b.artifactUrl : undefined,
    details: typeof b.details === 'string' ? b.details : '',
  }

  const supabase = createClient(env.supabase.url(), env.supabase.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await supabase.from('learning_progress_events').insert({
    user_id: auth.user.id,
    gap_name: parsed.gapName,
    gap_kind: parsed.gapKind,
    event_type: parsed.eventType,
    occurred_at: new Date().toISOString(),
    evidence_level: parsed.evidenceLevel,
    artifact_type: parsed.artifactType ?? 'none',
    artifact_url: parsed.artifactUrl ?? null,
    related_step_order: parsed.stepOrder ?? null,
    details: parsed.details ?? '',
  })

  if (error) {
    return NextResponse.json({ error: 'failed to log progress' }, { status: 502 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
