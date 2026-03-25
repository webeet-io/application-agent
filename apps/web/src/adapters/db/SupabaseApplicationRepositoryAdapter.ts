import type { IApplicationRepositoryPort, ApplicationRepositoryError } from '@/ports/outbound/IApplicationRepositoryPort'
import type { AttemptResult, Application, ApplicationId, ApplicationStatus } from '@ceevee/types'
import { createClient } from '@/lib/supabase/server'

export class SupabaseApplicationRepositoryAdapter implements IApplicationRepositoryPort {
  async findById(_id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, Application>> {
    throw new Error('Not implemented')
  }

  async findByUser(_userId: string): Promise<AttemptResult<ApplicationRepositoryError, Application[]>> {
    throw new Error('Not implemented')
  }

  async save(application: Application): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('applications')
      .upsert({
        id: application.id,
        user_id: application.userId,
        job_id: application.jobId,
        resume_id: application.resumeId,
        status: application.status,
        applied_at: application.appliedAt,
        notes: application.notes,
        embedding: application.embedding // This is the new vector column
      })

    if (error) {
      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    return { success: true, error: null, value: undefined }
  }

  async findSimilar(embedding: number[], limit: number): Promise<AttemptResult<ApplicationRepositoryError, Application[]>> {
    const supabase = await createClient()

    // This calls the postgres function we will create in Step 2
    const { data, error } = await supabase.rpc('match_applications', {
      query_embedding: embedding,
      match_threshold: 0.5, // You can adjust this for strictness
      match_count: limit,
    })

    if (error) {
      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    return { success: true, error: null, value: data as Application[] }
  }

  async updateStatus(_id: ApplicationId, _status: ApplicationStatus): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    throw new Error('Not implemented')
  }

  async delete(_id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    throw new Error('Not implemented')
  }
}