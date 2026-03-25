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
