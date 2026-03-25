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
Use web search whenever the answer depends on current information, external facts, or recent developments.
Base those answers on the retrieved sources and cite them clearly in your wording.
Prefer primary or highly reputable sources such as official company pages, regulators, major news organizations, and research publishers.
Avoid relying on low-authority aggregators or encyclopedias when better sources are available.
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

interface OpenAIResponsePayload {
  output_text?: string
  output?: ResponseOutputItem[]
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

interface ChatReply {
  reply?: string
  sources: NonNullable<ChatMessage['sources']>
}

function dedupeSources(sources: NonNullable<ChatMessage['sources']>) {
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

function extractReply(payload: OpenAIResponsePayload): ChatReply {
  const messageContent = payload.output
    ?.filter((item) => item.type === 'message' && item.role === 'assistant')
    .flatMap((item) => item.content ?? [])

  const reply =
    payload.output_text?.trim() ??
    messageContent
      ?.filter((item) => item.type === 'output_text')
      .map((item) => item.text?.trim())
      .find((text): text is string => Boolean(text))

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
  const { reply, sources } = extractReply(payload)

  if (!reply) {
    return Response.json({ error: 'The model returned an empty response.' }, { status: 502 })
  }

  return Response.json({ reply, sources })
}
