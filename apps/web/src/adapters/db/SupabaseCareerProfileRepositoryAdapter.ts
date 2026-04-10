import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  AttemptResult,
  CareerProfile,
  CareerProfileRecordId,
  CareerProfileStatus,
  OnboardingSessionId,
  PersistedCareerProfile,
  ResumeId,
} from '@ceevee/types'
import type {
  CareerProfileRepositoryError,
  ICareerProfileRepositoryPort,
} from '@/ports/outbound/ICareerProfileRepositoryPort'

interface CareerProfileRow {
  id: string
  user_id: string
  status: CareerProfileStatus
  profile_json: CareerProfile
  source_resume_id: string | null
  onboarding_session_id: string | null
  completeness_score: number
  created_at: string
  updated_at: string
}

function isMissingCareerProfileSchema(message: string): boolean {
  return (
    message.includes('career_profiles') &&
    (message.includes('does not exist') || message.includes('schema cache'))
  )
}

function toPersistedCareerProfile(row: CareerProfileRow): PersistedCareerProfile {
  return {
    id: row.id as CareerProfileRecordId,
    userId: row.user_id,
    status: row.status,
    profile: row.profile_json,
    sourceResumeId: row.source_resume_id as ResumeId | null,
    onboardingSessionId: row.onboarding_session_id as OnboardingSessionId | null,
    completenessScore: row.completeness_score,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export class SupabaseCareerProfileRepositoryAdapter implements ICareerProfileRepositoryPort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async findReadyByUser(
    userId: string,
  ): Promise<AttemptResult<CareerProfileRepositoryError, PersistedCareerProfile>> {
    const { data, error } = await this.client
      .from('career_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ready')
      .maybeSingle<CareerProfileRow>()

    if (error) {
      if (isMissingCareerProfileSchema(error.message)) {
        return { success: false, error: { type: 'not_found', userId }, value: null }
      }

      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    if (!data) {
      return { success: false, error: { type: 'not_found', userId }, value: null }
    }

    return { success: true, error: null, value: toPersistedCareerProfile(data) }
  }
}
