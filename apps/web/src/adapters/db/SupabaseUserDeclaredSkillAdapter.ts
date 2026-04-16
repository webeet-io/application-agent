import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { IUserDeclaredSkillPort, UserDeclaredSkillPortError } from '@/ports/outbound/IUserDeclaredSkillPort'
import type { AttemptResult } from '@ceevee/types'
import type { UserDeclaredSkillInput } from '@/domain/mentor-skill-gap'

interface UserDeclaredSkillRow {
  id: string
  user_id: string
  skill_name: string
  confidence: string
  evidence: string | null
  is_on_resume: boolean
}

function toSkillInput(row: UserDeclaredSkillRow): UserDeclaredSkillInput {
  return {
    name: row.skill_name,
    confidence: (row.confidence as UserDeclaredSkillInput['confidence']) ?? 'medium',
    evidence: row.evidence,
    isOnResume: row.is_on_resume,
  }
}

export class SupabaseUserDeclaredSkillAdapter implements IUserDeclaredSkillPort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async findDeclaredSkillsByUser(
    userId: string,
  ): Promise<AttemptResult<UserDeclaredSkillPortError, UserDeclaredSkillInput[]>> {
    const { data, error } = await this.client
      .from('user_declared_skills')
      .select('*')
      .eq('user_id', userId)
      .order('declared_at', { ascending: false })
      .returns<UserDeclaredSkillRow[]>()

    if (error) {
      return { success: false, error: { type: 'source_failed', message: error.message }, value: null }
    }

    return { success: true, error: null, value: (data ?? []).map(toSkillInput) }
  }
}
