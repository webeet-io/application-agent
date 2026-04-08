import type { AttemptResult } from '@ceevee/types'
import type { ChatMessage, ChatReply } from '@/domain/chat'

export type ChatAssistantError =
  | { type: 'invalid_message_history'; message: string }
  | { type: 'llm_call_failed'; message: string }
  | { type: 'empty_response' }

export interface IChatAssistantPort {
  reply(messages: ChatMessage[]): Promise<AttemptResult<ChatAssistantError, ChatReply>>
}
