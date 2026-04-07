import type { AttemptResult, Resume, ResumeId } from '@ceevee/types'

export type ResumeRepositoryError =
  | { type: 'not_found'; id: string }
  | { type: 'db_error'; message: string }

export interface IResumeRepositoryPort {
  findById(id: ResumeId): Promise<AttemptResult<ResumeRepositoryError, Resume>>
  findByUser(userId: string): Promise<AttemptResult<ResumeRepositoryError, Resume[]>>
  save(resume: Resume): Promise<AttemptResult<ResumeRepositoryError, void>>
  delete(id: ResumeId): Promise<AttemptResult<ResumeRepositoryError, void>>
}
