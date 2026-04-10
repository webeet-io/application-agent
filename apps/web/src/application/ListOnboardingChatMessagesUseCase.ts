import type { AttemptResult, OnboardingChatMessage, OnboardingSessionId } from '@ceevee/types'
import type {
  IOnboardingChatMessageRepositoryPort,
  OnboardingChatMessageRepositoryError,
} from '@/ports/outbound/IOnboardingChatMessageRepositoryPort'

export type ListOnboardingChatMessagesInput = {
  userId: string
  sessionId: OnboardingSessionId
}

export type ListOnboardingChatMessagesError =
  | { type: 'invalid_input'; message: string }
  | { type: 'db_error'; message: string }

function toDatabaseMessage(error: OnboardingChatMessageRepositoryError): string | null {
  if (error.type === 'db_error') {
    return error.message
  }

  return null
}

export class ListOnboardingChatMessagesUseCase {
  constructor(private readonly messages: IOnboardingChatMessageRepositoryPort) {}

  async execute(
    input: ListOnboardingChatMessagesInput,
  ): Promise<AttemptResult<ListOnboardingChatMessagesError, OnboardingChatMessage[]>> {
    if (!input.userId || input.userId.trim().length === 0) {
      return {
        success: false,
        error: { type: 'invalid_input', message: 'userId is required' },
        value: null,
      }
    }

    const result = await this.messages.listBySession(input)
    if (!result.success) {
      const message = toDatabaseMessage(result.error)
      if (message) {
        return { success: false, error: { type: 'db_error', message }, value: null }
      }

      return { success: true, error: null, value: [] }
    }

    return result
  }
}
