import OpenAI from 'openai'
import type { AttemptResult } from '@ceevee/types'
import { buildChatInstructions, type ChatMessage, type ChatReply, type ChatSource } from '@/domain/chat'
import type { ChatAssistantError, IChatAssistantPort } from '@/ports/outbound/IChatAssistantPort'

function toOpenAIInput(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))
}

interface ResponseAnnotation {
  type?: string
  title?: string
  url?: string
}

interface ResponseSourceItem {
  type?: string
  title?: string
  url?: string
}

interface ResponseOutputContentItem {
  type?: string
  text?: string
  annotations?: ResponseAnnotation[]
}

interface ResponseOutputItem {
  type?: string
  role?: string
  content?: ResponseOutputContentItem[]
  action?: {
    sources?: ResponseSourceItem[]
  }
}

interface OpenAIChatResponsePayload {
  output_text?: string
  output?: ResponseOutputItem[]
}

function dedupeSources(sources: ChatSource[]) {
  const seen = new Set<string>()

  return sources.filter((source) => {
    const key = `${source.url}::${source.title}`
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function extractChatReply(payload: OpenAIChatResponsePayload): ChatReply | null {
  const messageContent = payload.output
    ?.filter((item) => item.type === 'message' && item.role === 'assistant')
    .flatMap((item) => item.content ?? [])

  const reply =
    payload.output_text?.trim() ??
    messageContent
      ?.filter((item) => item.type === 'output_text')
      .map((item) => item.text?.trim())
      .find((text): text is string => Boolean(text))

  if (!reply) {
    return null
  }

  const annotationSources =
    messageContent
      ?.flatMap((item) => item.annotations ?? [])
      .filter((annotation) => annotation.type === 'url_citation')
      .flatMap((annotation) =>
        annotation.url && annotation.title
          ? [{ url: annotation.url, title: annotation.title }]
          : []
      ) ?? []

  const searchSources =
    payload.output
      ?.flatMap((item) => item.action?.sources ?? [])
      .filter((source) => source.type === 'url')
      .flatMap((source) =>
        source.url && source.title ? [{ url: source.url, title: source.title }] : []
      ) ?? []

  return {
    reply,
    sources: dedupeSources([...annotationSources, ...searchSources]),
  }
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
