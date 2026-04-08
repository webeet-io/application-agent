import type { AttemptResult } from '@ceevee/types'
import type { ChatMessage, ChatReply } from '@/domain/chat'
import type { ChatAssistantError, IChatAssistantPort } from '@/ports/outbound/IChatAssistantPort'

const MAX_HISTORY_MESSAGES = 20

export type AskChatError =
  | { type: 'invalid_message_history'; message: string }
  | { type: 'assistant_unavailable'; message: string }
  | { type: 'empty_reply'; message: string }

function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content.trim(),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES)
}

export class AskChatUseCase {
  constructor(private readonly assistant: IChatAssistantPort) {}

  async execute(messages: ChatMessage[]): Promise<AttemptResult<AskChatError, ChatReply>> {
    const normalizedMessages = normalizeMessages(messages)

    if (!normalizedMessages.length) {
      return {
        success: false,
        error: {
          type: 'invalid_message_history',
          message: 'The chat history must contain at least one non-empty message.',
        },
        value: null,
      }
    }

    const lastMessage = normalizedMessages.at(-1)
    if (!lastMessage || lastMessage.role !== 'user') {
      return {
        success: false,
        error: {
          type: 'invalid_message_history',
          message: 'The latest chat message must come from the user.',
        },
        value: null,
      }
    }

    const result = await this.assistant.reply(normalizedMessages)
    if (result.success) {
      return result
    }

    return {
      success: false,
      error: mapAssistantError(result.error),
      value: null,
    }
  }
}

export const askChatUseCaseConfig = {
  maxHistoryMessages: MAX_HISTORY_MESSAGES,
}

function mapAssistantError(error: ChatAssistantError): AskChatError {
  if (error.type === 'empty_response') {
    return {
      type: 'empty_reply',
      message: 'The assistant returned an empty reply.',
    }
  }

  return {
    type: 'assistant_unavailable',
    message: 'The assistant is currently unavailable. Please try again.',
  }
}
