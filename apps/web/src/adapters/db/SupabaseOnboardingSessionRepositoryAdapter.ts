import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  AttemptResult,
  CareerProfile,
  OnboardingSession,
  OnboardingSessionId,
  OnboardingSessionStatus,
  OnboardingStep,
  ResumeId,
} from '@ceevee/types'
import type {
  IOnboardingSessionRepositoryPort,
  OnboardingSessionRepositoryError,
} from '@/ports/outbound/IOnboardingSessionRepositoryPort'

interface OnboardingSessionRow {
  id: string
  user_id: string
  status: OnboardingSessionStatus
  current_step: OnboardingStep
  resume_id: string | null
  resume_text: string | null
  profile_draft_json: Partial<CareerProfile> | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

function isMissingOnboardingSchema(message: string): boolean {
  return (
    message.includes('onboarding_sessions') &&
    (message.includes('does not exist') || message.includes('schema cache'))
  )
}

function toOnboardingSession(row: OnboardingSessionRow): OnboardingSession {
  return {
    id: row.id as OnboardingSessionId,
    userId: row.user_id,
    status: row.status,
    currentStep: row.current_step,
    resumeId: row.resume_id as ResumeId | null,
    resumeText: row.resume_text,
    profileDraft: row.profile_draft_json,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

export class SupabaseOnboardingSessionRepositoryAdapter implements IOnboardingSessionRepositoryPort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async findActiveByUser(
    userId: string,
  ): Promise<AttemptResult<OnboardingSessionRepositoryError, OnboardingSession>> {
    const { data, error } = await this.client
      .from('onboarding_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .maybeSingle<OnboardingSessionRow>()

    if (error) {
      if (isMissingOnboardingSchema(error.message)) {
        return { success: false, error: { type: 'not_found', userId }, value: null }
      }

      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    if (!data) {
      return { success: false, error: { type: 'not_found', userId }, value: null }
    }

    return { success: true, error: null, value: toOnboardingSession(data) }
  }
}
