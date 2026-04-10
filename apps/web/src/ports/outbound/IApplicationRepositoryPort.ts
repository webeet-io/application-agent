import type { AttemptResult, Application, ApplicationId, ApplicationStatus } from '@ceevee/types'

export type ApplicationRepositoryError =
  | { type: 'not_found'; id: string }
  | { type: 'db_error'; message: string }

export interface IApplicationRepositoryPort {
  findById(id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, Application>>
  findByUser(userId: string): Promise<AttemptResult<ApplicationRepositoryError, Application[]>>
  
  // Notice that save() no longer takes an embedding parameter!
  save(application: Application): Promise<AttemptResult<ApplicationRepositoryError, void>>
  
  // We must define findSimilar so the Use Case can call it
  findSimilar(embedding: number[], limit: number): Promise<AttemptResult<ApplicationRepositoryError, Application[]>>
  
  updateStatus(id: ApplicationId, status: ApplicationStatus): Promise<AttemptResult<ApplicationRepositoryError, void>>
  delete(id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, void>>
<<<<<<< Updated upstream
  
  /**
   * Performs a vector similarity search to find past applications 
   * semantically related to the provided embedding.
   */
  findSimilar(embedding: number[], limit: number): Promise<AttemptResult<ApplicationRepositoryError, Application[]>>
=======
>>>>>>> Stashed changes
}