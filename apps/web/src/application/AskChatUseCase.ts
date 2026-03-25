import type { AttemptResult } from '@ceevee/types'
import type { ChatMessage, ChatReply } from '@/domain/chat'
import type { ChatAssistantError, IChatAssistantPort } from '@/ports/outbound/IChatAssistantPort'

export class AskChatUseCase {
  constructor(private readonly assistant: IChatAssistantPort) {}

  execute(messages: ChatMessage[]): Promise<AttemptResult<ChatAssistantError, ChatReply>> {
    return this.assistant.reply(messages)
  }
}
