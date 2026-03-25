'use client'

import { FormEvent, useEffect, useRef } from 'react'
import { renderMessageContent } from '@/modules/chat/lib/render-message-content'
import { useChatThread } from '@/modules/chat/hooks/use-chat-thread'
import { useVoiceInput } from '@/modules/chat/hooks/use-voice-input'

function MicrophoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="chat-composer__voice-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 1 0 7 0v-5A3.5 3.5 0 0 0 12 3Z" />
      <path d="M18 10.5a6 6 0 0 1-12 0" />
      <path d="M12 16.5v4.5" />
      <path d="M8.5 21h7" />
    </svg>
  )
}

export function ChatInterface() {
  const {
    error,
    input,
    isSending,
    messageToRevealId,
    messages,
    sendMessage: submitMessage,
    setError,
    setInput,
    setMessageToRevealId,
  } = useChatThread()
  const messageRefs = useRef<Record<string, HTMLElement | null>>({})
  const { isRecording, notice, toggleRecording, voiceLevels } = useVoiceInput({
    disabled: isSending,
    input,
    onTranscript: (transcript) => {
      setInput((current) => (current.trim() ? `${current.trimEnd()} ${transcript}` : transcript))
    },
    onClearError: () => setError(null),
  })

  useEffect(() => {
    if (!messageToRevealId) return

    const element = messageRefs.current[messageToRevealId]
    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMessageToRevealId(null)
  }, [messageToRevealId, messages])

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    await submitMessage()
  }

  return (
    <section className="chat-shell">
      <div className="chat-window">
        <div className="chat-window__header">
          <div className="chat-window__identity">
            <h2 className="chat-window__title">LLM chat interface</h2>
          </div>
          <p className="chat-window__eyebrow">Conversation Module</p>
        </div>

        <div className="chat-window__messages-frame">
          <div className="chat-window__messages" aria-live="polite">
            {messages.map((message) => (
              <article
                key={message.id}
                ref={(element) => {
                  messageRefs.current[message.id] = element
                }}
                className={`chat-bubble chat-bubble--${message.role}`}
              >
                <span className="chat-bubble__speaker">
                  {message.role === 'assistant' ? 'LLM' : 'User'}
                </span>
                <p>{renderMessageContent(message.content)}</p>
                {message.role === 'assistant' && message.sources?.length ? (
                  <div className="chat-bubble__sources">
                    <span className="chat-bubble__sources-label">Sources</span>
                    <ul className="chat-bubble__sources-list">
                      {message.sources.map((source) => (
                        <li key={`${source.url}-${source.title}`}>
                          <a
                            className="chat-source-link"
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span>{source.title}</span>
                            <span className="chat-source-link__url">{source.url}</span>
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
          </div>
        </div>

        <form className="chat-composer" onSubmit={sendMessage}>
          <div className="chat-composer__topline">
            <label className="chat-composer__label" htmlFor="chat-input">
              Your message
            </label>
            <span className="chat-composer__shortcut">
              Enter to send, Shift+Enter for a new line
            </span>
          </div>
          <div className="chat-composer__surface">
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
              placeholder="Ask a specific question, request a summary, or ask for a source-backed web answer..."
              rows={3}
            />
          </div>
          <div className="chat-composer__footer">
            <p className="chat-composer__hint">
              {isRecording
                ? 'Listening now. Speak naturally and stop the microphone when you are done.'
                : 'Keep prompts concrete for better answers. Current or factual questions can use web search.'}
            </p>
            <div className="chat-composer__actions">
              <div
                className={`chat-composer__voice-meter-wrap ${
                  isRecording ? 'chat-composer__voice-meter-wrap--active' : ''
                }`}
                aria-hidden="true"
              >
                <div className="chat-composer__voice-meter">
                  {voiceLevels.map((level, index) => (
                    <span
                      key={`voice-level-${index}`}
                      className="chat-composer__voice-bar"
                      style={{ transform: `scaleX(${level})` }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className={`chat-composer__voice ${
                  isRecording ? 'chat-composer__voice--recording' : ''
                }`}
                onClick={() => void toggleRecording()}
                disabled={isSending}
                aria-pressed={isRecording}
                aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                title={isRecording ? 'Stop recording' : 'Voice input'}
              >
                <MicrophoneIcon />
              </button>
              <button
                type="submit"
                className="chat-composer__send"
                disabled={isSending || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>
          {error ? <p className="chat-composer__error">{error}</p> : null}
          {notice ? <p className="chat-composer__hint">{notice}</p> : null}
        </form>
      </div>
    </section>
  )
}
