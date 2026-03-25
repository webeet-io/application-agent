export type ChatRole = 'user' | 'assistant'

export interface ChatSource {
  title: string
  url: string
}

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  sources?: ChatSource[]
}

export interface ChatReply {
  reply: string
  sources: ChatSource[]
}

export function buildChatInstructions(): string {
  return `You are the assistant inside CeeVee's chat interface.
You are the second participant in the conversation.
Answer directly, stay practical, and help with recruiting, applications, candidates, roles, and interview preparation.
Use web search whenever the answer depends on current information, external facts, or recent developments.
Base those answers on the retrieved sources and cite them clearly in your wording.
Prefer primary or highly reputable sources such as official company pages, regulators, major news organizations, and research publishers.
Avoid relying on low-authority aggregators or encyclopedias when better sources are available.
If the user asks for structured output, format it clearly.`
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

export interface OpenAIChatResponsePayload {
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

export function extractChatReply(payload: OpenAIChatResponsePayload): ChatReply | null {
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
