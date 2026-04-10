import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  ISkillGapApplicationHistoryPort,
  SkillGapApplicationHistoryPortError,
} from '@/ports/outbound/ISkillGapApplicationHistoryPort'
import type { AttemptResult } from '@ceevee/types'
import type { ApplicationHistorySignalInput } from '@/domain/mentor-skill-gap'

interface ApplicationRow {
  id: string
  job_id: string
  status: string
  notes: string | null
  job_listings: {
    title: string
  } | null
}

// Maps DB application_status values to the domain's expected set.
// 'no_response' is a domain concept that doesn't exist as a DB enum value —
// it is derived from 'applied' with no subsequent status change (not tracked here at MVP).
function mapStatus(
  raw: string,
): 'saved' | 'applied' | 'interview' | 'rejected' | 'offer' | 'withdrawn' {
  switch (raw) {
    case 'saved':
    case 'applied':
    case 'interview':
    case 'rejected':
    case 'offer':
    case 'withdrawn':
      return raw
    default:
      return 'applied'
  }
}

export class SupabaseSkillGapApplicationHistoryAdapter implements ISkillGapApplicationHistoryPort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async findApplicationHistorySignalsByUser(
    userId: string,
  ): Promise<AttemptResult<SkillGapApplicationHistoryPortError, ApplicationHistorySignalInput[]>> {
    const { data, error } = await this.client
      .from('applications')
      .select('id, job_id, status, notes, job_listings(title)')
      .eq('user_id', userId)
      .returns<ApplicationRow[]>()

    if (error) {
      return { success: false, error: { type: 'source_failed', message: error.message }, value: null }
    }

    const signals: ApplicationHistorySignalInput[] = (data ?? []).map((row) => ({
      applicationId: row.id,
      jobId: row.job_id,
      jobTitle: row.job_listings?.title ?? 'Unknown role',
      status: mapStatus(row.status),
      outcome: null,
      rejectedReason: null,
      // MVP: skill presence/absence is not tracked per application yet.
      // Full extraction requires parsing job description against resume — tracked as follow-up.
      skillsPresent: [],
      skillsMissing: [],
    }))

    return { success: true, error: null, value: signals }
  }
}
