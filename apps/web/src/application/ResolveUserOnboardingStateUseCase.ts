import type { AttemptResult, UserOnboardingState } from '@ceevee/types'
import type {
  CareerProfileRepositoryError,
  ICareerProfileRepositoryPort,
} from '@/ports/outbound/ICareerProfileRepositoryPort'
import type {
  IOnboardingSessionRepositoryPort,
  OnboardingSessionRepositoryError,
} from '@/ports/outbound/IOnboardingSessionRepositoryPort'

export type ResolveUserOnboardingStateInput = {
  userId: string
}

export type ResolveUserOnboardingStateError =
  | { type: 'invalid_input'; message: string }
  | { type: 'db_error'; message: string }

function toDatabaseMessage(
  error: CareerProfileRepositoryError | OnboardingSessionRepositoryError,
): string | null {
  if (error.type === 'db_error') {
    return error.message
  }

  return null
}

export class ResolveUserOnboardingStateUseCase {
  constructor(
    private readonly careerProfiles: ICareerProfileRepositoryPort,
    private readonly onboardingSessions: IOnboardingSessionRepositoryPort,
  ) {}

  async execute(
    input: ResolveUserOnboardingStateInput,
  ): Promise<AttemptResult<ResolveUserOnboardingStateError, UserOnboardingState>> {
    if (!input.userId || input.userId.trim().length === 0) {
      return {
        success: false,
        error: { type: 'invalid_input', message: 'userId is required' },
        value: null,
      }
    }

    const careerProfileResult = await this.careerProfiles.findReadyByUser(input.userId)
    if (careerProfileResult.success) {
      return {
        success: true,
        error: null,
        value: {
          status: 'profile_ready',
          activeSession: null,
          careerProfile: careerProfileResult.value,
        },
      }
    }

    const careerProfileMessage = toDatabaseMessage(careerProfileResult.error)
    if (careerProfileMessage) {
      return {
        success: false,
        error: { type: 'db_error', message: careerProfileMessage },
        value: null,
      }
    }

    const onboardingSessionResult = await this.onboardingSessions.findActiveByUser(input.userId)
    if (onboardingSessionResult.success) {
      return {
        success: true,
        error: null,
        value: {
          status: 'onboarding_in_progress',
          activeSession: onboardingSessionResult.value,
          careerProfile: null,
        },
      }
    }

    const onboardingSessionMessage = toDatabaseMessage(onboardingSessionResult.error)
    if (onboardingSessionMessage) {
      return {
        success: false,
        error: { type: 'db_error', message: onboardingSessionMessage },
        value: null,
      }
    }

    return {
      success: true,
      error: null,
      value: {
        status: 'needs_onboarding',
        activeSession: null,
        careerProfile: null,
      },
    }
  }
}
