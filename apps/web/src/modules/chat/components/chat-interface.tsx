'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import type { ChatMessage } from '@/modules/chat/types'

const starterMessages: ChatMessage[] = [
  {
    id: 'assistant-intro',
    role: 'assistant',
    content:
      'I am your recruiting copilot. Ask about a role, a candidate profile, or how to position an application strategy.',
  },
]

const suggestedPrompts = [
  'Summarize the strongest profile for a senior product role.',
  'Turn these notes into a concise candidate pitch.',
  'What follow-up questions should I ask in the next interview?',
]

function createMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  }
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()

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

      const payload = (await response.json().catch(() => null)) as
        | { reply?: string; error?: string; sources?: ChatMessage['sources'] }
        | null

      if (!response.ok || !payload?.reply) {
        throw new Error(payload?.error ?? 'The assistant could not respond.')
      }

      setMessages((current) => [
        ...current,
        {
          ...createMessage('assistant', payload.reply!),
          sources: payload.sources,
        },
      ])
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : 'The assistant could not respond.'
      setError(message)
      setMessages((current) => [
        ...current,
        createMessage(
          'assistant',
          'I could not answer right now. Check the server configuration and try again.'
        ),
      ])
    } finally {
      setIsSending(false)
    }
  }

  function applyPrompt(prompt: string) {
    setInput(prompt)
  }

  return (
    <section className="chat-shell">
      <div className="chat-window">
        <div className="chat-window__header">
          <div>
            <p className="chat-window__eyebrow">Conversation Module</p>
            <h2 className="chat-window__title">LLM chat interface</h2>
          </div>
          <div className="chat-window__status">
            <span className="chat-window__status-dot" />
            Assistant online
          </div>
        </div>

        <div className="chat-window__suggestions" aria-label="Suggested prompts">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="chat-window__suggestion"
              onClick={() => applyPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="chat-window__messages" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`chat-bubble chat-bubble--${message.role}`}
            >
              <span className="chat-bubble__speaker">
                {message.role === 'assistant' ? 'LLM' : 'User'}
              </span>
              <p>{message.content}</p>
              {message.role === 'assistant' && message.sources?.length ? (
                <div className="chat-bubble__sources">
                  <span className="chat-bubble__sources-label">Sources</span>
                  <ul className="chat-bubble__sources-list">
                    {message.sources.map((source) => (
                      <li key={`${source.url}-${source.title}`}>
                        <a href={source.url} target="_blank" rel="noreferrer">
                          {source.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ))}

          {isSending ? (
            <div className="chat-bubble chat-bubble--assistant chat-bubble--pending">
              <span className="chat-bubble__speaker">LLM</span>
              <div className="chat-typing" aria-label="Assistant is typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        <form className="chat-composer" onSubmit={sendMessage}>
          <label className="chat-composer__label" htmlFor="chat-input">
            Message
          </label>
          <textarea
            id="chat-input"
            className="chat-composer__input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void sendMessage()
              }
            }}
            placeholder="Ask the assistant anything relevant to the hiring workflow..."
            rows={3}
          />
          <div className="chat-composer__footer">
            <p className="chat-composer__hint">
              The assistant is the second participant and replies in a normal dialogue flow.
            </p>
            <button
              type="submit"
              className="chat-composer__send"
              disabled={isSending || !input.trim()}
            >
              Send
            </button>
          </div>
          {error ? <p className="chat-composer__error">{error}</p> : null}
        </form>
      </div>
    </section>
  )
}
