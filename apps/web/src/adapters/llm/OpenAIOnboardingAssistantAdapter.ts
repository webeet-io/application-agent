import OpenAI from 'openai'
import type { AttemptResult } from '@ceevee/types'
import { buildOnboardingChatInstructions } from '@/domain/onboarding-chat'
import type {
  IOnboardingAssistantPort,
  OnboardingAssistantError,
} from '@/ports/outbound/IOnboardingAssistantPort'

function formatRuntimeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'unknown error'
  }

  const errorWithMeta = error as Error & {
    status?: number
    code?: string
    type?: string
  }

  const details = [
    error.name || 'Error',
    typeof errorWithMeta.status === 'number' ? `status=${String(errorWithMeta.status)}` : null,
    typeof errorWithMeta.code === 'string' ? `code=${errorWithMeta.code}` : null,
    typeof errorWithMeta.type === 'string' ? `type=${errorWithMeta.type}` : null,
    error.message ? `message=${error.message}` : null,
  ].filter((part): part is string => Boolean(part))

  return details.join(' | ')
}

interface ResponseOutputContentItem {
  type?: string
  text?: string
}

interface ResponseOutputItem {
  type?: string
  role?: string
  content?: ResponseOutputContentItem[]
}

interface OpenAIOnboardingResponsePayload {
  output_text?: string
  output?: ResponseOutputItem[]
}

function extractReply(payload: OpenAIOnboardingResponsePayload): string | null {
  const messageContent = payload.output
    ?.filter((item) => item.type === 'message' && item.role === 'assistant')
    .flatMap((item) => item.content ?? [])

  return (
    payload.output_text?.trim() ??
    messageContent
      ?.filter((item) => item.type === 'output_text')
      .map((item) => item.text?.trim())
      .find((text): text is string => Boolean(text)) ??
    null
  )
}

export class OpenAIOnboardingAssistantAdapter implements IOnboardingAssistantPort {
  private readonly client: OpenAI

  constructor(
    apiKey: string,
    private readonly model = 'gpt-4.1-mini',
  ) {
    this.client = new OpenAI({ apiKey })
  }

  async reply(input: Parameters<IOnboardingAssistantPort['reply']>[0]) {
    let payload: OpenAIOnboardingResponsePayload

    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions: buildOnboardingChatInstructions(input),
        input: input.messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      })

      payload = response as OpenAIOnboardingResponsePayload
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'llm_call_failed',
          message: formatRuntimeError(error),
        },
        value: null,
      } satisfies AttemptResult<OnboardingAssistantError, { reply: string }>
    }

    const reply = extractReply(payload)
    if (!reply) {
      return {
        success: false,
        error: { type: 'empty_response' },
        value: null,
      } satisfies AttemptResult<OnboardingAssistantError, { reply: string }>
    }

    return {
      success: true,
      error: null,
      value: { reply },
    } satisfies AttemptResult<OnboardingAssistantError, { reply: string }>
  }
}
