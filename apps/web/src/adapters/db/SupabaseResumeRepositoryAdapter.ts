import type { IResumeRepositoryPort, ResumeRepositoryError } from '@/ports/outbound/IResumeRepositoryPort'
import type { AttemptResult, Resume, ResumeId } from '@ceevee/types'

export class SupabaseResumeRepositoryAdapter implements IResumeRepositoryPort {
  async findById(_id: ResumeId): Promise<AttemptResult<ResumeRepositoryError, Resume>> {
    throw new Error('Not implemented')
  }

  async findByUser(_userId: string): Promise<AttemptResult<ResumeRepositoryError, Resume[]>> {
    throw new Error('Not implemented')
  }

  async save(_resume: Resume): Promise<AttemptResult<ResumeRepositoryError, void>> {
    throw new Error('Not implemented')
  }

  async delete(_id: ResumeId): Promise<AttemptResult<ResumeRepositoryError, void>> {
    throw new Error('Not implemented')
  }
}
