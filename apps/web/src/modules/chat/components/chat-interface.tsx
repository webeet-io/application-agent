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
      className="h-5 w-5"
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

const labelClassName = 'text-[0.5rem] font-bold uppercase tracking-[0.12em]'

function getMessageCardClassName(role: 'assistant' | 'user') {
  if (role === 'user') {
    return 'justify-self-end max-w-full min-w-0 w-fit md:max-w-[78%] rounded-[20px] border border-[rgba(255,247,240,0.12)] bg-[linear-gradient(135deg,#2e211b,#1f1613)] px-[15px] pt-[14px] pb-[13px] text-[#fff7f0] shadow-[0_12px_32px_rgba(65,46,32,0.08)]'
  }

  return 'justify-self-start max-w-full min-w-0 w-fit md:max-w-[78%] rounded-[20px] border border-[rgba(58,44,33,0.08)] bg-[linear-gradient(180deg,rgba(255,253,248,0.96),rgba(247,240,232,0.92))] px-[15px] pt-[14px] pb-[13px] text-[#221914] shadow-[0_12px_32px_rgba(65,46,32,0.08)]'
}

function getMessageLinkClassName(role: 'assistant' | 'user') {
  if (role === 'user') {
    return 'rounded-sm font-semibold text-[#ffd4bf] underline decoration-2 decoration-[rgba(255,212,191,0.45)] underline-offset-[0.18em] outline-none transition-[background-color,color,text-decoration-color] duration-150 hover:bg-[rgba(255,247,240,0.08)] hover:text-[#fff7f0] focus-visible:bg-[rgba(255,247,240,0.12)] focus-visible:text-[#fff7f0]'
  }

  return 'rounded-sm font-semibold text-[#9f4e2b] underline decoration-2 decoration-[rgba(201,109,66,0.45)] underline-offset-[0.18em] outline-none transition-[background-color,color,text-decoration-color] duration-150 hover:bg-[rgba(201,109,66,0.1)] hover:text-[#7f3e21] focus-visible:bg-[rgba(201,109,66,0.14)] focus-visible:text-[#7f3e21]'
}

function getSourceCardClassName(role: 'assistant' | 'user') {
  if (role === 'user') {
    return 'grid gap-[3px] rounded-xl border border-[rgba(255,247,240,0.12)] bg-[rgba(255,247,240,0.06)] px-[11px] py-[9px] text-inherit transition duration-150 hover:border-[rgba(255,247,240,0.22)] hover:bg-[rgba(255,247,240,0.1)]'
  }

  return 'grid gap-[3px] rounded-xl border border-[rgba(58,44,33,0.1)] bg-[rgba(255,255,255,0.52)] px-[11px] py-[9px] text-inherit transition duration-150 hover:-translate-y-px hover:border-[rgba(201,109,66,0.34)] hover:bg-[rgba(255,248,242,0.9)] hover:shadow-[0_8px_18px_rgba(61,42,31,0.08)]'
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
    <section className="mx-auto w-full max-w-[940px]">
      <div className="grid gap-4 rounded-[34px] border border-[rgba(71,53,40,0.11)] bg-[rgba(252,249,244,0.8)] p-[22px] shadow-[0_28px_80px_rgba(65,46,32,0.16)] backdrop-blur-[18px]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[42rem]">
            <h2 className="m-0 text-[clamp(1.9rem,3vw,2.8rem)] leading-none">LLM chat interface</h2>
          </div>
          <p className={`${labelClassName} text-[#6d6055]`}>Conversation Module</p>
        </div>

        <div className="grid content-start gap-3 rounded-[26px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.42)] p-[14px]">
          <div className="grid max-h-[min(56vh,640px)] content-start gap-3 overflow-y-auto pr-0.5" aria-live="polite">
            {messages.map((message) => (
              <article
                key={message.id}
                ref={(element) => {
                  messageRefs.current[message.id] = element
                }}
                className={getMessageCardClassName(message.role)}
              >
                <span
                  className={`${labelClassName} block leading-none ${
                    message.role === 'user' ? 'text-[rgba(255,247,240,0.7)]' : 'text-[rgba(34,25,20,0.72)]'
                  }`}
                >
                  {message.role === 'assistant' ? 'LLM' : 'User'}
                </span>
                <div className="mt-0.5 whitespace-pre-wrap leading-[1.55]">
                  {renderMessageContent(message.content, {
                    linkClassName: getMessageLinkClassName(message.role),
                    rawLinkClassName: 'break-all',
                  })}
                </div>
                {message.role === 'assistant' && message.sources?.length ? (
                  <div className="mt-2.5 border-t border-[rgba(58,44,33,0.12)] pt-2.5">
                    <span className="block text-xs font-bold uppercase tracking-[0.08em] text-[#6d6055]">
                      Sources
                    </span>
                    <ul className="mt-2 grid list-none gap-1.5 pl-0">
                      {message.sources.map((source) => (
                        <li key={`${source.url}-${source.title}`}>
                          <a
                            className={getSourceCardClassName(message.role)}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span>{source.title}</span>
                            <span className="break-all text-[0.84rem] text-[#6d6055]">
                              {source.url}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}

            {isSending ? (
              <div className="min-w-[120px] justify-self-start rounded-[20px] border border-[rgba(58,44,33,0.08)] bg-[linear-gradient(180deg,rgba(255,253,248,0.96),rgba(247,240,232,0.92))] px-[15px] pt-[14px] pb-[13px] shadow-[0_12px_32px_rgba(65,46,32,0.08)]">
                <span className={`${labelClassName} block leading-none text-[rgba(34,25,20,0.72)]`}>
                  LLM
                </span>
                <div className="mt-2.5 inline-flex gap-1.5" aria-label="Assistant is typing">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[rgba(36,25,20,0.48)]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[rgba(36,25,20,0.48)] [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[rgba(36,25,20,0.48)] [animation-delay:240ms]" />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <form
          className="grid gap-3 rounded-[26px] border border-[rgba(58,44,33,0.1)] bg-[#fffdf9] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
          onSubmit={sendMessage}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className={`${labelClassName} text-[#221914]`} htmlFor="chat-input">
              Your message
            </label>
            <span className="text-[0.85rem] text-[#6d6055]">
              Enter to send, Shift+Enter for a new line
            </span>
          </div>
          <div className="rounded-[18px] border border-[rgba(58,44,33,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,252,248,1))] p-px">
            <textarea
              id="chat-input"
              className="min-h-[88px] w-full resize-y bg-transparent px-[14px] py-3 leading-[1.55] text-[#221914] outline-none"
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
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <p className="m-0 text-[0.92rem] text-[#6d6055]">
              {isRecording
                ? 'Listening now. Speak naturally and stop the microphone when you are done.'
                : 'Keep prompts concrete for better answers. Current or factual questions can use web search.'}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className={`flex w-[72px] justify-end transition-opacity duration-150 ${
                  isRecording ? 'opacity-100' : 'opacity-0'
                }`}
                aria-hidden="true"
              >
                <div className="flex h-7 w-[72px] items-center justify-end gap-[5px]">
                  {voiceLevels.map((level, index) => (
                    <span
                      key={`voice-level-${index}`}
                      className="h-2.5 min-w-1 flex-1 origin-right rounded-full bg-[linear-gradient(180deg,rgba(203,110,68,0.9),rgba(159,78,43,0.55))] opacity-90 shadow-[0_0_18px_rgba(203,110,68,0.18)] transition-transform duration-75 ease-out"
                      style={{ transform: `scaleX(${level})`, maxWidth: '8px' }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                className={`inline-flex h-12 w-12 items-center justify-center rounded-full border p-0 transition duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${
                  isRecording
                    ? 'border-[rgba(159,47,36,0.28)] bg-[rgba(255,239,236,0.95)] text-[#9f2f24]'
                    : 'border-[rgba(58,44,33,0.1)] bg-[rgba(255,255,255,0.9)] text-[#221914] hover:-translate-y-px hover:border-[rgba(201,109,66,0.28)] hover:bg-[rgba(255,247,241,0.95)]'
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
                className="rounded-full bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] px-[22px] py-[13px] font-bold text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] transition duration-150 hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)] disabled:cursor-not-allowed disabled:opacity-45"
                disabled={isSending || !input.trim()}
              >
                Send
              </button>
            </div>
          </div>
          {error ? <p className="mt-3 text-[0.92rem] text-[#9f2f24]">{error}</p> : null}
          {notice ? <p className="m-0 text-[0.92rem] text-[#6d6055]">{notice}</p> : null}
        </form>
      </div>
    </section>
  )
}
