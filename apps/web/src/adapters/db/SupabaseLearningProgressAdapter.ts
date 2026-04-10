import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ILearningProgressPort, LearningProgressPortError } from '@/ports/outbound/ILearningProgressPort'
import type { AttemptResult } from '@ceevee/types'
import type { LearningProgressEvent } from '@/domain/mentor-skill-gap'

interface LearningProgressEventRow {
  id: string
  user_id: string
  gap_name: string
  gap_kind: string
  event_type: string
  occurred_at: string
  evidence_level: string
  artifact_type: string | null
  artifact_url: string | null
  related_step_order: number | null
  details: string | null
}

function toProgressEvent(row: LearningProgressEventRow): LearningProgressEvent {
  return {
    eventId: row.id,
    userId: row.user_id,
    gapName: row.gap_name,
    gapKind: row.gap_kind as LearningProgressEvent['gapKind'],
    eventType: row.event_type as LearningProgressEvent['eventType'],
    occurredAt: row.occurred_at,
    evidenceLevel: row.evidence_level as LearningProgressEvent['evidenceLevel'],
    artifactType: (row.artifact_type ?? 'none') as LearningProgressEvent['artifactType'],
    artifactUrl: row.artifact_url,
    relatedStepOrder: row.related_step_order,
    details: row.details ?? '',
  }
}

export class SupabaseLearningProgressAdapter implements ILearningProgressPort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async listEventsForUser(
    userId: string,
  ): Promise<AttemptResult<LearningProgressPortError, LearningProgressEvent[]>> {
    const { data, error } = await this.client
      .from('learning_progress_events')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: true })
      .returns<LearningProgressEventRow[]>()

    if (error) {
      return { success: false, error: { type: 'source_failed', message: error.message }, value: null }
    }

    return { success: true, error: null, value: (data ?? []).map(toProgressEvent) }
  }
}
