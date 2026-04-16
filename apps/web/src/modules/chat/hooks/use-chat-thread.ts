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

function extractNextErrorDetail(markup: string): string | null {
  if (typeof DOMParser === 'undefined') {
    return null
  }

  try {
    const document = new DOMParser().parseFromString(markup, 'text/html')
    const nextData = document.querySelector('#__NEXT_DATA__')?.textContent
    if (!nextData) {
      return null
    }

    const parsed = JSON.parse(nextData) as {
      err?: {
        message?: string
        stack?: string
      }
    }

    const detail = [parsed.err?.message, parsed.err?.stack].filter(
      (part): part is string => Boolean(part),
    )

    return detail.length ? detail.join('\n\n') : null
  } catch {
    return null
  }
}

function stripHtml(markup: string): string {
  if (typeof DOMParser === 'undefined') {
    return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  return new DOMParser().parseFromString(markup, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}

function buildResponseDebugDetail(response: Response, responseText: string): string {
  const contentType = response.headers.get('content-type') ?? 'unknown'
  const nextErrorDetail = contentType.includes('text/html') ? extractNextErrorDetail(responseText) : null
  const bodyExcerpt = contentType.includes('text/html')
    ? stripHtml(responseText).slice(0, 600)
    : responseText.slice(0, 600).trim()

  return [
    `HTTP ${response.status} ${response.statusText}`.trim(),
    `Content-Type: ${contentType}`,
    nextErrorDetail,
    bodyExcerpt ? `Response excerpt:\n${bodyExcerpt}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join('\n\n')
}

function buildCaughtErrorDebugDetail(caughtError: unknown): string | null {
  if (!(caughtError instanceof Error)) {
    return typeof caughtError === 'string' ? caughtError : null
  }

  const detail = [caughtError.name ? `${caughtError.name}: ${caughtError.message}` : caughtError.message]

  if ('debugDetail' in caughtError && typeof caughtError.debugDetail === 'string' && caughtError.debugDetail.trim()) {
    detail.push(caughtError.debugDetail)
  }

  return detail.filter(Boolean).join('\n\n') || null
}

export function useChatThread() {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [errorDebugDetail, setErrorDebugDetail] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [messageToRevealId, setMessageToRevealId] = useState<string | null>(null)

  async function sendMessage() {
    const pendingSend = buildPendingChatSend(messages, input, isSending)
    if (!pendingSend) return

    setMessages(pendingSend.nextMessages)
    setInput('')
    setError(null)
    setErrorDebugDetail(null)
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

      const responseText = await response.text()
      const payload = responseText
        ? ((() => {
            try {
              return JSON.parse(responseText) as ChatResponsePayload
            } catch {
              return null
            }
          })())
        : null

      if (!response.ok || !payload?.reply) {
        const failure = new Error(payload?.error ?? 'The assistant could not respond.') as Error & {
          debugDetail?: string
        }
        failure.debugDetail =
          payload?.debugDetail ??
          (responseText ? buildResponseDebugDetail(response, responseText) : `HTTP ${response.status} ${response.statusText}`.trim())
        throw failure
      }

      const assistantMessage = createAssistantSuccessMessage(payload.reply, payload.sources)

      setMessages((current) => [...current, assistantMessage])
      setMessageToRevealId(assistantMessage.id)
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'The assistant could not respond.'

      setError(message)
      setErrorDebugDetail(buildCaughtErrorDebugDetail(caughtError))

      const assistantMessage = createAssistantFailureMessage()

      setMessages((current) => [...current, assistantMessage])
      setMessageToRevealId(assistantMessage.id)
    } finally {
      setIsSending(false)
    }
  }

  return {
    error,
    errorDebugDetail,
    input,
    isSending,
    messageToRevealId,
    messages,
    sendMessage,
    setError,
    setErrorDebugDetail,
    setInput,
    setMessageToRevealId,
  }
}
