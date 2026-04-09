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
