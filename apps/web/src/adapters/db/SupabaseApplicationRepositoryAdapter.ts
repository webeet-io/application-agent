import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { IApplicationRepositoryPort, ApplicationRepositoryError } from '@/ports/outbound/IApplicationRepositoryPort'
import type { AttemptResult, Application, ApplicationId, ApplicationStatus, JobId, ResumeId } from '@ceevee/types'

interface ApplicationRow {
  id: string
  user_id: string
  job_id: string
  resume_id: string
  status: ApplicationStatus
  applied_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

function toApplication(row: ApplicationRow): Application {
  return {
    id: row.id as ApplicationId,
    userId: row.user_id,
    jobId: row.job_id as JobId,
    resumeId: row.resume_id as ResumeId,
    status: row.status,
    appliedAt: row.applied_at ? new Date(row.applied_at) : null,
    notes: row.notes,
  }
}

export class SupabaseApplicationRepositoryAdapter implements IApplicationRepositoryPort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async findById(id: ApplicationId, userId: string): Promise<AttemptResult<ApplicationRepositoryError, Application>> {
    const { data, error } = await this.client
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle<ApplicationRow>()

    if (error) {
      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    if (!data) {
      return { success: false, error: { type: 'not_found', id }, value: null }
    }

    return { success: true, error: null, value: toApplication(data) }
  }

  async findByUser(userId: string): Promise<AttemptResult<ApplicationRepositoryError, Application[]>> {
    const { data, error } = await this.client
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<ApplicationRow[]>()

    if (error) {
      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    return { success: true, error: null, value: (data ?? []).map(toApplication) }
  }

  async save(application: Application): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    const { error } = await this.client
      .from('applications')
      .insert({
        id: application.id,
        user_id: application.userId,
        job_id: application.jobId,
        resume_id: application.resumeId,
        status: application.status,
        applied_at: application.appliedAt ? application.appliedAt.toISOString() : null,
        notes: application.notes,
      })

    if (error) {
      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    return { success: true, error: null, value: undefined }
  }

  async updateStatus(id: ApplicationId, userId: string, status: ApplicationStatus): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    const { data, error } = await this.client
      .from('applications')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')

    if (error) {
      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    if (!data || data.length === 0) {
      return { success: false, error: { type: 'not_found', id }, value: null }
    }

    return { success: true, error: null, value: undefined }
  }

  async delete(id: ApplicationId, userId: string): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    const { data, error } = await this.client
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')

    if (error) {
      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    if (!data || data.length === 0) {
      return { success: false, error: { type: 'not_found', id }, value: null }
    }

    return { success: true, error: null, value: undefined }
  }
}
