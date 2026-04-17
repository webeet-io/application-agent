import type {
  AttemptResult,
  CareerProfile,
  CareerProfileStatus,
  OnboardingSessionId,
  PersistedCareerProfile,
  ResumeId,
} from '@ceevee/types'

export type CareerProfileRepositoryError =
  | { type: 'not_found'; userId: string }
  | { type: 'db_error'; message: string }

export interface ICareerProfileRepositoryPort {
  findReadyByUser(
    userId: string,
  ): Promise<AttemptResult<CareerProfileRepositoryError, PersistedCareerProfile>>
  upsertForUser(input: {
    userId: string
    status: CareerProfileStatus
    profile: CareerProfile
    sourceResumeId: ResumeId | null
    onboardingSessionId: OnboardingSessionId | null
    completenessScore: number
  }): Promise<AttemptResult<CareerProfileRepositoryError, PersistedCareerProfile>>
}
