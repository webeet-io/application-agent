import type {
  AttemptResult,
  OnboardingChatMessage,
  OnboardingSession,
  OnboardingSessionId,
} from '@ceevee/types'
import type {
  IOnboardingAssistantPort,
} from '@/ports/outbound/IOnboardingAssistantPort'
import type {
  IOnboardingChatMessageRepositoryPort,
  OnboardingChatMessageRepositoryError,
} from '@/ports/outbound/IOnboardingChatMessageRepositoryPort'
import type {
  IOnboardingSessionRepositoryPort,
  OnboardingSessionRepositoryError,
} from '@/ports/outbound/IOnboardingSessionRepositoryPort'

export type AdvanceOnboardingChatInput =
  | {
      userId: string
      sessionId: OnboardingSessionId
      action: 'kickoff'
    }
  | {
      userId: string
      sessionId: OnboardingSessionId
      action: 'reply'
      message: string
    }

export type AdvanceOnboardingChatError =
  | { type: 'invalid_input'; message: string }
  | { type: 'invalid_session'; message: string }
  | { type: 'db_error'; message: string }

export interface AdvanceOnboardingChatResult {
  session: OnboardingSession
  messages: OnboardingChatMessage[]
}

function toDatabaseMessage(
  error: OnboardingSessionRepositoryError | OnboardingChatMessageRepositoryError,
): string | null {
  if (error.type === 'db_error') {
    return error.message
  }

  return null
}

function buildFallbackReply(input: {
  session: OnboardingSession
  mode: 'kickoff' | 'reply'
  latestUserMessage?: string
}): string {
  if (input.mode === 'kickoff') {
    if (input.session.resumeId) {
      return 'Your resume is connected. To build a strong career profile, start by telling me which role you are aiming for and what kind of experience you want to highlight most.'
    }

    return 'Let us start with the basics. What is your current or most recent role, and which type of role are you aiming for next?'
  }

  return 'Thanks, that already helps. Next, tell me about the most relevant technologies, tools, or skills you have used in real work, projects, or studies.'
}

function normalizeUserMessage(message: string): string {
  return message.trim()
}

export class AdvanceOnboardingChatUseCase {
  constructor(
    private readonly onboardingSessions: IOnboardingSessionRepositoryPort,
    private readonly messages: IOnboardingChatMessageRepositoryPort,
    private readonly assistant: IOnboardingAssistantPort,
  ) {}

  async execute(
    input: AdvanceOnboardingChatInput,
  ): Promise<AttemptResult<AdvanceOnboardingChatError, AdvanceOnboardingChatResult>> {
    if (!input.userId || input.userId.trim().length === 0) {
      return {
        success: false,
        error: { type: 'invalid_input', message: 'userId is required' },
        value: null,
      }
    }

    if (input.action === 'reply' && normalizeUserMessage(input.message).length === 0) {
      return {
        success: false,
        error: { type: 'invalid_input', message: 'message is required' },
        value: null,
      }
    }

    const activeSessionResult = await this.onboardingSessions.findActiveByUser(input.userId)
    if (!activeSessionResult.success) {
      const message = toDatabaseMessage(activeSessionResult.error)
      return {
        success: false,
        error: {
          type: message ? 'db_error' : 'invalid_session',
          message: message ?? 'No active onboarding session was found for this user.',
        },
        value: null,
      }
    }

    if (activeSessionResult.value.id !== input.sessionId) {
      return {
        success: false,
        error: { type: 'invalid_session', message: 'The onboarding session is not active anymore.' },
        value: null,
      }
    }

    let session = activeSessionResult.value
    if (session.currentStep !== 'guided_chat') {
      const sessionStepResult = await this.onboardingSessions.setCurrentStep({
        sessionId: session.id,
        currentStep: 'guided_chat',
      })

      if (!sessionStepResult.success) {
        const message = toDatabaseMessage(sessionStepResult.error)
        return {
          success: false,
          error: { type: 'db_error', message: message ?? 'Unable to update onboarding step.' },
          value: null,
        }
      }

      session = sessionStepResult.value
    }

    const existingMessagesResult = await this.messages.listBySession({
      userId: input.userId,
      sessionId: session.id,
    })

    if (!existingMessagesResult.success) {
      const message = toDatabaseMessage(existingMessagesResult.error)
      return {
        success: false,
        error: { type: 'db_error', message: message ?? 'Unable to load onboarding messages.' },
        value: null,
      }
    }

    const existingMessages = existingMessagesResult.value
    if (input.action === 'kickoff' && existingMessages.length > 0) {
      return {
        success: true,
        error: null,
        value: { session, messages: existingMessages },
      }
    }

    const updatedMessages = [...existingMessages]

    if (input.action === 'reply') {
      const userMessageResult = await this.messages.save({
        userId: input.userId,
        sessionId: session.id,
        role: 'user',
        content: normalizeUserMessage(input.message),
      })

      if (!userMessageResult.success) {
        const message = toDatabaseMessage(userMessageResult.error)
        return {
          success: false,
          error: { type: 'db_error', message: message ?? 'Unable to save user message.' },
          value: null,
        }
      }

      updatedMessages.push(userMessageResult.value)
    }

    const assistantInputMessages = updatedMessages
      .filter((message) => message.role === 'assistant' || message.role === 'user')
      .map((message) => ({
        role: message.role,
        content: message.content,
      }))

    const assistantReplyResult = await this.assistant.reply({
      session,
      messages: assistantInputMessages,
      mode: input.action,
    })

    const assistantReply = assistantReplyResult.success
      ? assistantReplyResult.value.reply
      : buildFallbackReply({
          session,
          mode: input.action,
          latestUserMessage: input.action === 'reply' ? input.message : undefined,
        })

    const assistantMessageResult = await this.messages.save({
      userId: input.userId,
      sessionId: session.id,
      role: 'assistant',
      content: assistantReply,
    })

    if (!assistantMessageResult.success) {
      const message = toDatabaseMessage(assistantMessageResult.error)
      return {
        success: false,
        error: { type: 'db_error', message: message ?? 'Unable to save assistant reply.' },
        value: null,
      }
    }

    updatedMessages.push(assistantMessageResult.value)

    return {
      success: true,
      error: null,
      value: {
        session,
        messages: updatedMessages,
      },
    }
  }
}
