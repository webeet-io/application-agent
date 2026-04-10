import type {
  AttemptResult,
  OnboardingChatMessage,
  OnboardingSession,
  OnboardingSessionId,
  PersistedCareerProfile,
} from '@ceevee/types'
import { buildOnboardingCompletionPreview, type OnboardingCompletionPreview } from '@/domain/onboarding-profile'
import type {
  CareerProfileRepositoryError,
  ICareerProfileRepositoryPort,
} from '@/ports/outbound/ICareerProfileRepositoryPort'
import type {
  IOnboardingChatMessageRepositoryPort,
  OnboardingChatMessageRepositoryError,
} from '@/ports/outbound/IOnboardingChatMessageRepositoryPort'
import type {
  IOnboardingSessionRepositoryPort,
  OnboardingSessionRepositoryError,
} from '@/ports/outbound/IOnboardingSessionRepositoryPort'

export type CompleteOnboardingInput = {
  userId: string
  sessionId: OnboardingSessionId
  force?: boolean
}

export type CompleteOnboardingError =
  | { type: 'invalid_input'; message: string }
  | { type: 'invalid_session'; message: string }
  | { type: 'not_ready'; message: string; preview: OnboardingCompletionPreview }
  | { type: 'db_error'; message: string }

export interface CompleteOnboardingResult {
  session: OnboardingSession
  messages: OnboardingChatMessage[]
  preview: OnboardingCompletionPreview
  careerProfile: PersistedCareerProfile
}

function toDatabaseMessage(
  error:
    | CareerProfileRepositoryError
    | OnboardingChatMessageRepositoryError
    | OnboardingSessionRepositoryError,
): string | null {
  if (error.type === 'db_error') {
    return error.message
  }

  return null
}

export class CompleteOnboardingUseCase {
  constructor(
    private readonly onboardingSessions: IOnboardingSessionRepositoryPort,
    private readonly onboardingMessages: IOnboardingChatMessageRepositoryPort,
    private readonly careerProfiles: ICareerProfileRepositoryPort,
  ) {}

  async execute(
    input: CompleteOnboardingInput,
  ): Promise<AttemptResult<CompleteOnboardingError, CompleteOnboardingResult>> {
    if (!input.userId || input.userId.trim().length === 0) {
      return {
        success: false,
        error: { type: 'invalid_input', message: 'userId is required' },
        value: null,
      }
    }

    const sessionResult = await this.onboardingSessions.findActiveByUser(input.userId)
    if (!sessionResult.success) {
      const message = toDatabaseMessage(sessionResult.error)
      return {
        success: false,
        error: {
          type: message ? 'db_error' : 'invalid_session',
          message: message ?? 'No active onboarding session was found for this user.',
        },
        value: null,
      }
    }

    if (sessionResult.value.id !== input.sessionId) {
      return {
        success: false,
        error: { type: 'invalid_session', message: 'The onboarding session is not active anymore.' },
        value: null,
      }
    }

    const messagesResult = await this.onboardingMessages.listBySession({
      userId: input.userId,
      sessionId: input.sessionId,
    })
    if (!messagesResult.success) {
      const message = toDatabaseMessage(messagesResult.error)
      return {
        success: false,
        error: { type: 'db_error', message: message ?? 'Unable to load onboarding messages.' },
        value: null,
      }
    }

    const preview = buildOnboardingCompletionPreview({
      userId: input.userId,
      session: sessionResult.value,
      messages: messagesResult.value,
    })

    if (!preview.isReadyForCompletion && !input.force) {
      return {
        success: false,
        error: {
          type: 'not_ready',
          message: 'More onboarding information is recommended before continuing.',
          preview,
        },
        value: null,
      }
    }

    const draftSessionResult = await this.onboardingSessions.saveProfileDraft({
      sessionId: input.sessionId,
      profileDraft: preview.draft,
      currentStep: 'review',
    })
    if (!draftSessionResult.success) {
      const message = toDatabaseMessage(draftSessionResult.error)
      return {
        success: false,
        error: { type: 'db_error', message: message ?? 'Unable to save profile draft.' },
        value: null,
      }
    }

    const careerProfileResult = await this.careerProfiles.upsertForUser({
      userId: input.userId,
      status: 'ready',
      profile: preview.draft,
      sourceResumeId: draftSessionResult.value.resumeId,
      onboardingSessionId: draftSessionResult.value.id,
      completenessScore: preview.completenessScore,
    })
    if (!careerProfileResult.success) {
      const message = toDatabaseMessage(careerProfileResult.error)
      return {
        success: false,
        error: { type: 'db_error', message: message ?? 'Unable to persist career profile.' },
        value: null,
      }
    }

    const completedSessionResult = await this.onboardingSessions.complete({
      sessionId: input.sessionId,
      profileDraft: preview.draft,
    })
    if (!completedSessionResult.success) {
      const message = toDatabaseMessage(completedSessionResult.error)
      return {
        success: false,
        error: { type: 'db_error', message: message ?? 'Unable to complete onboarding session.' },
        value: null,
      }
    }

    return {
      success: true,
      error: null,
      value: {
        session: completedSessionResult.value,
        messages: messagesResult.value,
        preview,
        careerProfile: careerProfileResult.value,
      },
    }
  }
}
