import type { IApplicationRepositoryPort, ApplicationRepositoryError } from '@/ports/outbound/IApplicationRepositoryPort'
import type { AttemptResult, Application, ApplicationId, ApplicationStatus } from '@ceevee/types'

export class SupabaseApplicationRepositoryAdapter implements IApplicationRepositoryPort {
  async findById(_id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, Application>> {
    throw new Error('Not implemented')
  }

  async findByUser(_userId: string): Promise<AttemptResult<ApplicationRepositoryError, Application[]>> {
    throw new Error('Not implemented')
  }

  async save(_application: Application): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    throw new Error('Not implemented')
  }

  async updateStatus(_id: ApplicationId, _status: ApplicationStatus): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    throw new Error('Not implemented')
  }

  async delete(_id: ApplicationId): Promise<AttemptResult<ApplicationRepositoryError, void>> {
    throw new Error('Not implemented')
  }
}
