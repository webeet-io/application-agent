import type { AttemptResult, Application, ApplicationId, ApplicationStatus } from '@ceevee/types'

export type ApplicationRepositoryError =
  | { type: 'not_found'; id: string }
  | { type: 'db_error'; message: string }

export interface IApplicationRepositoryPort {
  findById(id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, Application>>
  findByUser(userId: string): Promise<AttemptResult<ApplicationRepositoryError, Application[]>>
  
  // The repository receives the embedding as an optional parameter from the use case
  save(application: Application, embeddingVector?: number[]): Promise<AttemptResult<ApplicationRepositoryError, void>>
  
  updateStatus(id: ApplicationId, status: ApplicationStatus): Promise<AttemptResult<ApplicationRepositoryError, void>>
  delete(id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, void>>
  
  /**
   * Performs a vector similarity search to find past applications 
   * semantically related to the provided embedding.
   */
  findSimilar(embedding: number[], limit: number): Promise<AttemptResult<ApplicationRepositoryError, Application[]>>
}
