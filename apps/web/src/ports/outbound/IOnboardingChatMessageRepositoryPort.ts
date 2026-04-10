import type {
  AttemptResult,
  OnboardingChatMessage,
  OnboardingChatRole,
  OnboardingSessionId,
} from '@ceevee/types'

export type OnboardingChatMessageRepositoryError =
  | { type: 'not_found'; userId?: string; sessionId?: string }
  | { type: 'db_error'; message: string }

export interface IOnboardingChatMessageRepositoryPort {
  listBySession(input: {
    userId: string
    sessionId: OnboardingSessionId
  }): Promise<AttemptResult<OnboardingChatMessageRepositoryError, OnboardingChatMessage[]>>
  save(input: {
    userId: string
    sessionId: OnboardingSessionId
    role: OnboardingChatRole
    content: string
  }): Promise<AttemptResult<OnboardingChatMessageRepositoryError, OnboardingChatMessage>>
}
