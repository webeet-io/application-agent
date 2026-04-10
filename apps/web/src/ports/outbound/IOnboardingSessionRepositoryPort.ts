import type { AttemptResult, OnboardingSession } from '@ceevee/types'

export type OnboardingSessionRepositoryError =
  | { type: 'not_found'; userId: string }
  | { type: 'db_error'; message: string }

export interface IOnboardingSessionRepositoryPort {
  findActiveByUser(
    userId: string,
  ): Promise<AttemptResult<OnboardingSessionRepositoryError, OnboardingSession>>
}
