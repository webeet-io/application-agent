import type { AttemptResult, PersistedCareerProfile } from '@ceevee/types'

export type CareerProfileRepositoryError =
  | { type: 'not_found'; userId: string }
  | { type: 'db_error'; message: string }

export interface ICareerProfileRepositoryPort {
  findReadyByUser(
    userId: string,
  ): Promise<AttemptResult<CareerProfileRepositoryError, PersistedCareerProfile>>
}
