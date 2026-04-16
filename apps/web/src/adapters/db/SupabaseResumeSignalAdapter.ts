import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { IResumeSignalPort, ResumeSignalPortError } from '@/ports/outbound/IResumeSignalPort'
import type { AttemptResult } from '@ceevee/types'
import type { ResumeSignalInput } from '@/domain/mentor-skill-gap'

interface ResumeRow {
  id: string
  user_id: string
  label: string
  file_url: string
  original_file_name: string
}

export class SupabaseResumeSignalAdapter implements IResumeSignalPort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async findCurrentResumeSignalsByUser(
    userId: string,
  ): Promise<AttemptResult<ResumeSignalPortError, ResumeSignalInput>> {
    const { data, error } = await this.client
      .from('resumes')
      .select('id, user_id, label, file_url, original_file_name')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<ResumeRow>()

    if (error) {
      return { success: false, error: { type: 'source_failed', message: error.message }, value: null }
    }

    if (!data) {
      return { success: false, error: { type: 'resume_not_found', userId }, value: null }
    }

    // MVP: resume content is not parsed yet — skills/signals are empty.
    // Full extraction from PDF content is tracked as a follow-up.
    // The use case degrades gracefully on sparse resume input.
    return {
      success: true,
      error: null,
      value: {
        resumeId: data.id,
        userId: data.user_id,
        skills: [],
        experienceSignals: [],
        roleSignals: [],
      },
    }
  }
}
