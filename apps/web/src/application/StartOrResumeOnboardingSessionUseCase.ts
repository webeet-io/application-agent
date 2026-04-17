import type { AttemptResult, OnboardingSession, OnboardingStep } from '@ceevee/types'
import type {
  IOnboardingSessionRepositoryPort,
  OnboardingSessionRepositoryError,
} from '@/ports/outbound/IOnboardingSessionRepositoryPort'

export type StartOrResumeOnboardingSessionInput = {
  userId: string
  startStep: Extract<OnboardingStep, 'resume_upload' | 'guided_chat'>
}

export type StartOrResumeOnboardingSessionError =
  | { type: 'invalid_input'; message: string }
  | { type: 'db_error'; message: string }

function toDatabaseMessage(error: OnboardingSessionRepositoryError): string | null {
  if (error.type === 'db_error') {
    return error.message
  }

  return null
}

export class StartOrResumeOnboardingSessionUseCase {
  constructor(private readonly onboardingSessions: IOnboardingSessionRepositoryPort) {}

  async execute(
    input: StartOrResumeOnboardingSessionInput,
  ): Promise<AttemptResult<StartOrResumeOnboardingSessionError, OnboardingSession>> {
    if (!input.userId || input.userId.trim().length === 0) {
      return {
        success: false,
        error: { type: 'invalid_input', message: 'userId is required' },
        value: null,
      }
    }

    const activeSessionResult = await this.onboardingSessions.findActiveByUser(input.userId)
    if (activeSessionResult.success) {
      if (
        input.startStep === 'guided_chat' &&
        activeSessionResult.value.currentStep === 'resume_upload'
      ) {
        const advancedSessionResult = await this.onboardingSessions.setCurrentStep({
          sessionId: activeSessionResult.value.id,
          currentStep: 'guided_chat',
        })

        if (!advancedSessionResult.success) {
          const message = toDatabaseMessage(advancedSessionResult.error)
          return {
            success: false,
            error: { type: 'db_error', message: message ?? 'Unable to update onboarding session.' },
            value: null,
          }
        }

        return { success: true, error: null, value: advancedSessionResult.value }
      }

      return { success: true, error: null, value: activeSessionResult.value }
    }

    const activeSessionMessage = toDatabaseMessage(activeSessionResult.error)
    if (activeSessionMessage) {
      return {
        success: false,
        error: { type: 'db_error', message: activeSessionMessage },
        value: null,
      }
    }

    const createSessionResult = await this.onboardingSessions.createForUser({
      userId: input.userId,
      currentStep: input.startStep,
    })

    if (!createSessionResult.success) {
      const message = toDatabaseMessage(createSessionResult.error)
      return {
        success: false,
        error: { type: 'db_error', message: message ?? 'Unable to create onboarding session.' },
        value: null,
      }
    }

    return { success: true, error: null, value: createSessionResult.value }
  }
}
