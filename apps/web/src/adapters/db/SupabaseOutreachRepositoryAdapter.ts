import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AttemptResult } from '@ceevee/types'
import type { IOutreachRepositoryPort, OutreachLog, OutreachRepositoryError } from '@/ports/outbound/IOutreachRepositoryPort'

interface ApplicationRow {
  id: string
  user_id: string
}

export class SupabaseOutreachRepositoryAdapter implements IOutreachRepositoryPort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async log(outreach: OutreachLog): Promise<AttemptResult<OutreachRepositoryError, void>> {
    if (!outreach.userId || outreach.userId.trim().length === 0) {
      return { success: false, error: { type: 'db_error', message: 'userId is required' }, value: null }
    }

    if (!outreach.applicationId || outreach.applicationId.trim().length === 0) {
      return { success: false, error: { type: 'db_error', message: 'applicationId is required' }, value: null }
    }

    const ownership = await this.client
      .from('applications')
      .select('id, user_id')
      .eq('id', outreach.applicationId)
      .eq('user_id', outreach.userId)
      .maybeSingle<ApplicationRow>()

    if (ownership.error) {
      return { success: false, error: { type: 'db_error', message: ownership.error.message }, value: null }
    }

    if (!ownership.data) {
      return { success: false, error: { type: 'not_found', id: outreach.applicationId }, value: null }
    }

    const { error } = await this.client
      .from('outreach_logs')
      .insert({
        id: outreach.id,
        application_id: outreach.applicationId,
        user_id: outreach.userId,
        contact_name: outreach.contactName,
        contact_email: outreach.contactEmail,
        status: outreach.status,
        drafted_at: outreach.draftedAt.toISOString(),
        sent_at: outreach.sentAt ? outreach.sentAt.toISOString() : null,
        notes: outreach.notes ?? null,
      })

    if (error) {
      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    return { success: true, error: null, value: undefined }
  }
}
