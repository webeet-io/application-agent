import type { AttemptResult, Application, ApplicationId, ApplicationStatus } from '@ceevee/types'

export type ApplicationRepositoryError =
  | { type: 'not_found'; id: string }
  | { type: 'db_error'; message: string }

export interface IApplicationRepositoryPort {
  findById(id: ApplicationId, userId: string): Promise<AttemptResult<ApplicationRepositoryError, Application>>
  findByUser(userId: string): Promise<AttemptResult<ApplicationRepositoryError, Application[]>>
  save(application: Application): Promise<AttemptResult<ApplicationRepositoryError, void>>
  updateStatus(id: ApplicationId, userId: string, status: ApplicationStatus): Promise<AttemptResult<ApplicationRepositoryError, void>>
  delete(id: ApplicationId, userId: string): Promise<AttemptResult<ApplicationRepositoryError, void>>
}
