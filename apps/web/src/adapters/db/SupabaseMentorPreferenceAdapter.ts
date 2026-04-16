import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { IMentorSkillGapPreferencePort, MentorSkillGapPreferencePortError } from '@/ports/outbound/IMentorSkillGapPreferencePort'
import type { AttemptResult } from '@ceevee/types'
import type { MentorSkillGapPreferences, SkillGapStrategyMode, NormalizedSeniority, SupportedRoleFamily } from '@/domain/mentor-skill-gap'

interface MentorPreferenceRow {
  id: string
  user_id: string
  strategy_mode: string
  target_role_families: string[]
  target_seniority: string
  created_at: string
  updated_at: string
}

function toPreferences(row: MentorPreferenceRow): MentorSkillGapPreferences {
  return {
    strategyMode: row.strategy_mode as SkillGapStrategyMode,
    targetRoleFamilies: row.target_role_families as SupportedRoleFamily[],
    targetSeniority: row.target_seniority as NormalizedSeniority,
  }
}

export class SupabaseMentorPreferenceAdapter implements IMentorSkillGapPreferencePort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async findPreferencesByUser(
    userId: string,
  ): Promise<AttemptResult<MentorSkillGapPreferencePortError, MentorSkillGapPreferences>> {
    const { data, error } = await this.client
      .from('mentor_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle<MentorPreferenceRow>()

    if (error) {
      return { success: false, error: { type: 'source_failed', message: error.message }, value: null }
    }

    if (!data) {
      return { success: false, error: { type: 'not_found', userId }, value: null }
    }

    return { success: true, error: null, value: toPreferences(data) }
  }
}
