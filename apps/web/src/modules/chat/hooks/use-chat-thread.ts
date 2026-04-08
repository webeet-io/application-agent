'use client'

import { useState } from 'react'
import type { ChatMessage } from '@/domain/chat'
import {
  buildPendingChatSend,
  createAssistantFailureMessage,
  createAssistantSuccessMessage,
  starterMessages,
  type ChatResponsePayload,
} from './chat-thread-state'

export function useChatThread() {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [messageToRevealId, setMessageToRevealId] = useState<string | null>(null)

  async function sendMessage() {
    const pendingSend = buildPendingChatSend(messages, input, isSending)
    if (!pendingSend) return

    setMessages(pendingSend.nextMessages)
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
          messages: pendingSend.nextMessages,
        }),
      })

      const payload = (await response.json().catch(() => null)) as ChatResponsePayload | null

      if (!response.ok || !payload?.reply) {
        throw new Error(payload?.error ?? 'The assistant could not respond.')
      }

      const assistantMessage = createAssistantSuccessMessage(payload.reply, payload.sources)

      setMessages((current) => [...current, assistantMessage])
      setMessageToRevealId(assistantMessage.id)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'The assistant could not respond.'

      setError(message)

      const assistantMessage = createAssistantFailureMessage()

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
