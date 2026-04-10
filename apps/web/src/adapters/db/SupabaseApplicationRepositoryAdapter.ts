import type { IApplicationRepositoryPort, ApplicationRepositoryError } from '@/ports/outbound/IApplicationRepositoryPort'
import type { AttemptResult, Application, ApplicationId, ApplicationStatus } from '@ceevee/types'
import { createClient } from '@/lib/supabase/server'
import type { IEmbeddingPort } from '@/ports/outbound/IEmbeddingPort'

export class SupabaseApplicationRepositoryAdapter implements IApplicationRepositoryPort {
  
  // Inject the embedding port so the adapter can generate vectors itself
  constructor(private embeddingPort: IEmbeddingPort) {}

  async findById(_id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, Application>> {
    return { success: false, error: { type: 'db_error', message: 'Not implemented' }, value: null }
  }

  async findByUser(_userId: string): Promise<AttemptResult<ApplicationRepositoryError, Application[]>> {
    return { success: false, error: { type: 'db_error', message: 'Not implemented' }, value: null }
  }

  async save(application: Application): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    const supabase = await createClient()

    // 1. Generate the embedding internally before saving
    const textToEmbed = `Job ID: ${application.jobId}, Notes: ${application.notes || ''}`
    const embeddingResult = await this.embeddingPort.generate(textToEmbed)

    // 2. Save the application normally
    const { error: appError } = await supabase
      .from('applications')
      .upsert({
        id: application.id,
        user_id: application.userId,
        job_id: application.jobId,
        resume_id: application.resumeId,
        status: application.status,
        applied_at: application.appliedAt,
        notes: application.notes
      })

    if (appError) {
      return { success: false, error: { type: 'db_error', message: appError.message }, value: null }
    }

    // 3. Save the embedding to the new centralized table
    if (embeddingResult.success) {
      const { error: embedError } = await supabase
        .from('embeddings')
        .upsert({
          resource_type: 'application',
          resource_id: application.id,
          content: textToEmbed,
          embedding: embeddingResult.value
        })

      if (embedError) {
        return { success: false, error: { type: 'db_error', message: embedError.message }, value: null }
      }
    }

    return { success: true, error: null, value: undefined }
  }

  async findSimilar(embedding: number[], limit: number): Promise<AttemptResult<ApplicationRepositoryError, Application[]>> {
    const supabase = await createClient()

    const { data: embeddingData, error: rpcError } = await supabase.rpc('match_embeddings', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit,
      p_resource_type: 'application'
    })

    if (rpcError) {
      return { success: false, error: { type: 'db_error', message: rpcError.message }, value: null }
    }

    if (!embeddingData || embeddingData.length === 0) {
        return { success: true, error: null, value: [] }
    }

    // Fixed the 'any' type error here!
    const applicationIds = embeddingData.map((row: { resource_id: string }) => row.resource_id)

    const { data: appsData, error: appsError } = await supabase
      .from('applications')
      .select('*')
      .in('id', applicationIds)

    if (appsError) {
      return { success: false, error: { type: 'db_error', message: appsError.message }, value: null }
    }

    return { success: true, error: null, value: appsData as Application[] }
  }

  async updateStatus(_id: ApplicationId, _status: ApplicationStatus): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    return { success: false, error: { type: 'db_error', message: 'Not implemented' }, value: null }
  }

  async delete(_id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    return { success: false, error: { type: 'db_error', message: 'Not implemented' }, value: null }
  }
}