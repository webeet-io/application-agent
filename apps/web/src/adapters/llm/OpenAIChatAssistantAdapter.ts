import OpenAI from 'openai'
import type { AttemptResult } from '@ceevee/types'
import {
  buildChatInstructions,
  extractChatReply,
  type ChatMessage,
  type ChatReply,
  type OpenAIChatResponsePayload,
} from '@/domain/chat'
import type { ChatAssistantError, IChatAssistantPort } from '@/ports/outbound/IChatAssistantPort'

function toOpenAIInput(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))
}

export class OpenAIChatAssistantAdapter implements IChatAssistantPort {
  private readonly client: OpenAI

  constructor(
    apiKey: string,
    private readonly model = 'gpt-4.1-mini',
  ) {
    this.client = new OpenAI({ apiKey })
  }

  async reply(
    messages: ChatMessage[],
  ): Promise<AttemptResult<ChatAssistantError, ChatReply>> {
    let payload: OpenAIChatResponsePayload

    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions: buildChatInstructions(),
        include: ['web_search_call.action.sources'],
        tool_choice: 'auto',
        tools: [
          {
            type: 'web_search',
            user_location: {
              type: 'approximate',
              country: 'DE',
              timezone: 'Europe/Berlin',
            },
          },
        ],
        input: toOpenAIInput(messages),
      })

      payload = response as OpenAIChatResponsePayload
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'llm_call_failed',
          message: error instanceof Error ? error.message : 'unknown error',
        },
        value: null,
      }
    }

    const reply = extractChatReply(payload)
    if (!reply) {
      return {
        success: false,
        error: { type: 'empty_response' },
        value: null,
      }
    }

    return {
      success: true,
      error: null,
      value: reply,
    }
  }
}
