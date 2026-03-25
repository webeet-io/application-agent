import { z } from 'zod'
import type { ChatMessage } from '@/modules/chat/types'

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      })
    )
    .min(1),
})

const SYSTEM_PROMPT = `You are the assistant inside CeeVee's chat interface.
You are the second participant in the conversation.
Answer directly, stay practical, and help with recruiting, applications, candidates, roles, and interview preparation.
If the user asks for structured output, format it clearly.`

function toOpenAIInput(messages: ChatMessage[]) {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }))
}

export const runtime = 'nodejs'

interface ResponseOutputContentItem {
  type?: string
  text?: string
}

interface ResponseOutputItem {
  type?: string
  role?: string
  content?: ResponseOutputContentItem[]
}

interface OpenAIResponsePayload {
  output_text?: string
  output?: ResponseOutputItem[]
}

function extractReply(payload: OpenAIResponsePayload) {
  const directReply = payload.output_text?.trim()
  if (directReply) {
    return directReply
  }

  const content = payload.output
    ?.filter((item) => item.type === 'message' && item.role === 'assistant')
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === 'output_text')
    .map((item) => item.text?.trim())
    .find((text): text is string => Boolean(text))

  return content
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid chat payload.' }, { status: 400 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json(
      { error: 'OPENAI_API_KEY is missing on the server.' },
      { status: 503 }
    )
  }

  const model = process.env.OPENAI_CHAT_MODEL ?? 'gpt-4.1-mini'

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      instructions: SYSTEM_PROMPT,
      input: toOpenAIInput(parsed.data.messages),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    return Response.json(
      {
        error: `OpenAI request failed: ${errorText || response.statusText}`,
      },
      { status: 502 }
    )
  }

  const payload = (await response.json()) as OpenAIResponsePayload
  const reply = extractReply(payload)

  if (!reply) {
    return Response.json({ error: 'The model returned an empty response.' }, { status: 502 })
  }

  return Response.json({ reply })
}
