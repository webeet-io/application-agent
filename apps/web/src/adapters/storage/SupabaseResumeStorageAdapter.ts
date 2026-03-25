import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AttemptResult } from '@ceevee/types'
import type { IResumeStoragePort, ResumeStorageError, ResumeStorageUploadInput } from '@/ports/outbound/IResumeStoragePort'

export class SupabaseResumeStorageAdapter implements IResumeStoragePort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async upload(input: ResumeStorageUploadInput): Promise<AttemptResult<ResumeStorageError, { storagePath: string }>> {
    const safeFileName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${input.userId}/${input.resumeId}/${safeFileName}`

    const { error } = await this.client.storage
      .from('resumes')
      .upload(storagePath, new Uint8Array(input.content), {
        contentType: input.mimeType,
        upsert: false,
      })

    if (error) {
      return { success: false, error: { type: 'upload_failed', message: error.message }, value: null }
    }

    return { success: true, error: null, value: { storagePath } }
  }
}
