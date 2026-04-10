import type { IApplicationRepositoryPort, ApplicationRepositoryError } from '@/ports/outbound/IApplicationRepositoryPort'
import type { AttemptResult, Application, ApplicationId, ApplicationStatus } from '@ceevee/types'
import { createClient } from '@/lib/supabase/server'
<<<<<<< Updated upstream

export class SupabaseApplicationRepositoryAdapter implements IApplicationRepositoryPort {
  
  // FIX 1: No more throwing errors. We return AttemptResult properly.
=======
import type { IEmbeddingPort } from '@/ports/outbound/IEmbeddingPort'

export class SupabaseApplicationRepositoryAdapter implements IApplicationRepositoryPort {
  
  // Inject the embedding port so the DB adapter can generate vectors itself!
  constructor(private embeddingPort: IEmbeddingPort) {}

>>>>>>> Stashed changes
  async findById(_id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, Application>> {
    return { success: false, error: { type: 'db_error', message: 'Not implemented' }, value: null }
  }

  async findByUser(_userId: string): Promise<AttemptResult<ApplicationRepositoryError, Application[]>> {
    return { success: false, error: { type: 'db_error', message: 'Not implemented' }, value: null }
  }

<<<<<<< Updated upstream
  // FIX 2: Implementation of Option B (Centralized Embeddings Table)
  async save(
    application: Application,
    embeddingVector?: number[]
  ): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    const supabase = await createClient()

    // 1. Save the application normally (NO VECTOR HERE)
=======
  async save(application: Application): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    const supabase = await createClient()

    // 1. Generate the embedding internally before saving
    const textToEmbed = `Job ID: ${application.jobId}, Notes: ${application.notes || ''}`
    const embeddingResult = await this.embeddingPort.generate(textToEmbed)

    // 2. Save the application normally
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
    // 2. Save the embedding to the new centralized table (if provided)
    if (embeddingVector) {
      const { error: embedError } = await supabase
        .from('embeddings')
        .upsert({
          resource_type: 'application', // Tag it!
          resource_id: application.id,  // Link it!
          content: 'application context', // Placeholder string as required by schema
          embedding: embeddingVector
=======
    // 3. Save the embedding to the new centralized table
    if (embeddingResult.success) {
      const { error: embedError } = await supabase
        .from('embeddings')
        .upsert({
          resource_type: 'application',
          resource_id: application.id,
          content: textToEmbed,
          embedding: embeddingResult.value
>>>>>>> Stashed changes
        })

      if (embedError) {
        return { success: false, error: { type: 'db_error', message: embedError.message }, value: null }
      }
    }

    return { success: true, error: null, value: undefined }
  }

<<<<<<< Updated upstream
  // FIX 3: Implementation of Option B Search (JOIN Logic)
  async findSimilar(embedding: number[], limit: number): Promise<AttemptResult<ApplicationRepositoryError, Application[]>> {
    const supabase = await createClient()

    // 1. Call the NEW generic RPC function Anca requested
=======
  async findSimilar(embedding: number[], limit: number): Promise<AttemptResult<ApplicationRepositoryError, Application[]>> {
    const supabase = await createClient()

>>>>>>> Stashed changes
    const { data: embeddingData, error: rpcError } = await supabase.rpc('match_embeddings', {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit,
<<<<<<< Updated upstream
      p_resource_type: 'application' // Only look for application vectors!
=======
      p_resource_type: 'application'
>>>>>>> Stashed changes
    })

    if (rpcError) {
      return { success: false, error: { type: 'db_error', message: rpcError.message }, value: null }
    }

    if (!embeddingData || embeddingData.length === 0) {
        return { success: true, error: null, value: [] }
    }

<<<<<<< Updated upstream
    // 2. Extract the application IDs from the matched embeddings
    const applicationIds = embeddingData.map((row: any) => row.resource_id);

    // 3. Fetch the actual applications using those IDs
=======
    const applicationIds = embeddingData.map((row: any) => row.resource_id);

>>>>>>> Stashed changes
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