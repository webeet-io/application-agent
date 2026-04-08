import type { ChatMessage } from '@/domain/chat'

const assistantFallbackReply =
  'I could not answer right now. Check the server configuration and try again.'

export const starterMessages: ChatMessage[] = [
  {
    id: 'assistant-intro',
    role: 'assistant',
    content:
      'I am your recruiting copilot. Ask about a role, a candidate profile, or how to position an application strategy.',
  },
]

function defaultCreateMessageId(role: ChatMessage['role']) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createChatMessage(
  role: ChatMessage['role'],
  content: string,
  createId: (role: ChatMessage['role']) => string = defaultCreateMessageId,
): ChatMessage {
  return {
    id: createId(role),
    role,
    content,
  }
}

export interface ChatResponsePayload {
  reply?: string
  error?: string
  sources?: ChatMessage['sources']
}

export interface PendingChatSend {
  content: string
  nextMessages: ChatMessage[]
  nextUserMessage: ChatMessage
}

export function buildPendingChatSend(
  messages: ChatMessage[],
  input: string,
  isSending: boolean,
  createId?: (role: ChatMessage['role']) => string,
): PendingChatSend | null {
  const content = input.trim()
  if (!content || isSending) {
    return null
  }

  const nextUserMessage = createChatMessage('user', content, createId)
  return {
    content,
    nextUserMessage,
    nextMessages: [...messages, nextUserMessage],
  }
}

export function createAssistantSuccessMessage(
  reply: string,
  sources: ChatMessage['sources'],
  createId?: (role: ChatMessage['role']) => string,
): ChatMessage {
  return {
    ...createChatMessage('assistant', reply, createId),
    sources,
  }
}

export function createAssistantFailureMessage(
  createId?: (role: ChatMessage['role']) => string,
): ChatMessage {
  return createChatMessage('assistant', assistantFallbackReply, createId)
}
