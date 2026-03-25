'use client'

import { useState } from 'react'
import type { ChatMessage } from '@/domain/chat'

const starterMessages: ChatMessage[] = [
  {
    id: 'assistant-intro',
    role: 'assistant',
    content:
      'I am your recruiting copilot. Ask about a role, a candidate profile, or how to position an application strategy.',
  },
]

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  }
}

interface ChatResponsePayload {
  reply?: string
  error?: string
  sources?: ChatMessage['sources']
}

export function useChatThread() {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [messageToRevealId, setMessageToRevealId] = useState<string | null>(null)

  async function sendMessage() {
    const content = input.trim()
    if (!content || isSending) return

    const nextUserMessage = createMessage('user', content)
    const nextMessages = [...messages, nextUserMessage]

    setMessages(nextMessages)
    setInput('')
    setError(null)
    setIsSending(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: nextMessages,
        }),
      })

      const payload = (await response.json().catch(() => null)) as ChatResponsePayload | null

      if (!response.ok || !payload?.reply) {
        throw new Error(payload?.error ?? 'The assistant could not respond.')
      }

      const assistantMessage = {
        ...createMessage('assistant', payload.reply),
        sources: payload.sources,
      }

      setMessages((current) => [...current, assistantMessage])
      setMessageToRevealId(assistantMessage.id)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'The assistant could not respond.'

      setError(message)

      const assistantMessage = createMessage(
        'assistant',
        'I could not answer right now. Check the server configuration and try again.',
      )

      setMessages((current) => [...current, assistantMessage])
      setMessageToRevealId(assistantMessage.id)
    } finally {
      setIsSending(false)
    }
  }

  return {
    error,
    input,
    isSending,
    messageToRevealId,
    messages,
    sendMessage,
    setError,
    setInput,
    setMessageToRevealId,
  }
}
