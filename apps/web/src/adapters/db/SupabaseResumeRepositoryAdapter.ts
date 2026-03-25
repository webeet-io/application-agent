import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { IResumeRepositoryPort, ResumeRepositoryError } from '@/ports/outbound/IResumeRepositoryPort'
import type { AttemptResult, Resume, ResumeId } from '@ceevee/types'

interface ResumeRow {
  id: string
  user_id: string
  label: string
  file_url: string
  storage_path: string
  original_file_name: string
  mime_type: string
  size_bytes: number
  created_at: string
}

function toResume(row: ResumeRow): Resume {
  return {
    id: row.id as ResumeId,
    userId: row.user_id,
    label: row.label,
    fileUrl: row.file_url,
    storagePath: row.storage_path,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: new Date(row.created_at),
  }
}

export class SupabaseResumeRepositoryAdapter implements IResumeRepositoryPort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async findById(id: ResumeId): Promise<AttemptResult<ResumeRepositoryError, Resume>> {
    const { data, error } = await this.client
      .from('resumes')
      .select('*')
      .eq('id', id)
      .maybeSingle<ResumeRow>()

    if (error) {
      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    if (!data) {
      return { success: false, error: { type: 'not_found', id }, value: null }
    }

    return { success: true, error: null, value: toResume(data) }
  }

  async findByUser(userId: string): Promise<AttemptResult<ResumeRepositoryError, Resume[]>> {
    const { data, error } = await this.client
      .from('resumes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .returns<ResumeRow[]>()

    if (error) {
      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    return { success: true, error: null, value: (data ?? []).map(toResume) }
  }

  async save(resume: Resume): Promise<AttemptResult<ResumeRepositoryError, void>> {
    const { error } = await this.client
      .from('resumes')
      .insert({
        id: resume.id,
        user_id: resume.userId,
        label: resume.label,
        file_url: resume.fileUrl,
        storage_path: resume.storagePath ?? resume.fileUrl,
        original_file_name: resume.originalFileName ?? 'resume.pdf',
        mime_type: resume.mimeType ?? 'application/pdf',
        size_bytes: resume.sizeBytes ?? 0,
        created_at: resume.createdAt.toISOString(),
      })

    if (error) {
      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    return { success: true, error: null, value: undefined }
  }

  async delete(id: ResumeId): Promise<AttemptResult<ResumeRepositoryError, void>> {
    const { data, error } = await this.client
      .from('resumes')
      .delete()
      .eq('id', id)
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
