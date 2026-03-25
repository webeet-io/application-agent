'use client'

import { FormEvent, Fragment, ReactNode, useEffect, useRef, useState } from 'react'
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

const markdownLinkPattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
const rawUrlPattern = /(https?:\/\/[^\s]+)(?![^<]*>|[^[]*\])/g
const voiceMeterBarCount = 16

interface SpeechRecognitionAlternative {
  transcript: string
}

interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative
  isFinal: boolean
  length: number
}

interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResult>
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function trimBrowserTranscript(text: string) {
  return text.trim().replace(/\s+/g, ' ')
}

function createIdleVoiceLevels() {
  return Array.from({ length: voiceMeterBarCount }, () => 0.18)
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null
  }

  const speechRecognition = (
    window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
  ).SpeechRecognition

  const webkitSpeechRecognition = (
    window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor
      webkitSpeechRecognition?: SpeechRecognitionConstructor
    }
  ).webkitSpeechRecognition

  return speechRecognition ?? webkitSpeechRecognition ?? null
}

function detectSpeechLang(text: string) {
  if (/[\u0400-\u04FF]/.test(text)) {
    return 'ru'
  }

  if (/[äöüßÄÖÜ]/.test(text)) {
    return 'de'
  }

  return 'en'
}

function renderMessageContent(content: string): ReactNode {
  return content.split('\n').map((line, lineIndex) => (
    <Fragment key={`line-${lineIndex}`}>
      {lineIndex > 0 ? <br /> : null}
      {renderInlineContent(line)}
    </Fragment>
  ))
}

function renderInlineContent(line: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of line.matchAll(markdownLinkPattern)) {
    const [fullMatch, label, url] = match
    const start = match.index ?? 0

    if (start > cursor) {
      nodes.push(...renderRawUrls(line.slice(cursor, start), cursor))
    }

    nodes.push(
      <a
        key={`md-${start}-${url}`}
        className="chat-link"
        href={url}
        target="_blank"
        rel="noreferrer"
      >
        {label}
      </a>,
    )

    cursor = start + fullMatch.length
  }

  if (cursor < line.length) {
    nodes.push(...renderRawUrls(line.slice(cursor), cursor))
  }

  return nodes.length ? nodes : [line]
}

function renderRawUrls(text: string, offset: number): ReactNode[] {
  const nodes: ReactNode[] = []
  let cursor = 0

  for (const match of text.matchAll(rawUrlPattern)) {
    const [url] = match
    const start = match.index ?? 0

    if (start > cursor) {
      nodes.push(text.slice(cursor, start))
    }

    const trimmedUrl = url.replace(/[),.;!?]+$/, '')
    const trailing = url.slice(trimmedUrl.length)

    nodes.push(
      <a
        key={`url-${offset + start}-${trimmedUrl}`}
        className="chat-link chat-link--raw"
        href={trimmedUrl}
        target="_blank"
        rel="noreferrer"
      >
        {trimmedUrl}
      </a>,
    )

    if (trailing) {
      nodes.push(trailing)
    }

    cursor = start + url.length
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }

  return nodes.length ? nodes : [text]
}

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
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceLevels, setVoiceLevels] = useState<number[]>(createIdleVoiceLevels)
  const [messageToRevealId, setMessageToRevealId] = useState<string | null>(null)
  const messageRefs = useRef<Record<string, HTMLElement | null>>({})
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const speechRecognitionCtorRef = useRef<SpeechRecognitionConstructor | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!messageToRevealId) return

    const element = messageRefs.current[messageToRevealId]
    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setMessageToRevealId(null)
  }, [messageToRevealId, messages])

  useEffect(() => {
    const SpeechRecognition = getSpeechRecognitionConstructor()
    if (!SpeechRecognition) {
      setNotice('Voice input is not supported in this browser.')
      return
    }
    speechRecognitionCtorRef.current = SpeechRecognition

    return () => {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      speechRecognitionRef.current?.stop()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      analyserRef.current?.disconnect()
      audioContextRef.current?.close().catch(() => null)
    }
  }, [])

  function stopVoiceMeter() {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    analyserRef.current?.disconnect()
    analyserRef.current = null

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => null)
      audioContextRef.current = null
    }

    setVoiceLevels(createIdleVoiceLevels())
  }

  function startVoiceMeter(stream: MediaStream) {
    if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') {
      return
    }

    stopVoiceMeter()

    const audioContext = new window.AudioContext()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(stream)
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.82
    source.connect(analyser)

    const frequencyData = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      analyser.getByteFrequencyData(frequencyData)

      const nextLevels = Array.from({ length: voiceMeterBarCount }, (_, index) => {
        const bucketSize = Math.max(1, Math.floor(frequencyData.length / voiceMeterBarCount))
        const start = index * bucketSize
        const end = Math.min(frequencyData.length, start + bucketSize)
        const slice = frequencyData.slice(start, end)
        const average =
          slice.length > 0 ? slice.reduce((sum, value) => sum + value, 0) / slice.length : 0

        return Math.max(0.14, Math.min(1, average / 160))
      })

      setVoiceLevels(nextLevels)
      animationFrameRef.current = requestAnimationFrame(tick)
    }

    audioContextRef.current = audioContext
    analyserRef.current = analyser
    animationFrameRef.current = requestAnimationFrame(tick)
  }

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

      const payload = (await response.json().catch(() => null)) as {
        reply?: string
        error?: string
        sources?: ChatMessage['sources']
      } | null

      if (!response.ok || !payload?.reply) {
        throw new Error(payload?.error ?? 'The assistant could not respond.')
      }

      const assistantMessage = {
        ...createMessage('assistant', payload.reply!),
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

  function applyPrompt(prompt: string) {
    setInput(prompt)
  }

  async function toggleRecording() {
    if (isSending) return
    if (isRecording) {
      speechRecognitionRef.current?.stop()
      setIsRecording(false)
      stopVoiceMeter()
      return
    }

    const SpeechRecognition = speechRecognitionCtorRef.current
    if (!SpeechRecognition) {
      setNotice('Voice input is unavailable in this browser. You can still type.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      startVoiceMeter(stream)

      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = detectSpeechLang(input || navigator.language || 'en')
      recognition.onresult = (event) => {
        const transcript = trimBrowserTranscript(
          Array.from(event.results)
            .map((result) => result[0]?.transcript ?? '')
            .join(' '),
        )

        if (transcript) {
          setInput((current) =>
            current.trim() ? `${current.trimEnd()} ${transcript}` : transcript,
          )
        }
        setError(null)
      }
      recognition.onerror = (event) => {
        const errorName =
          'error' in event ? String((event as Event & { error?: string }).error) : ''

        if (errorName === 'network' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
          setNotice('Voice input is unavailable offline. Please type.')
        } else {
          setNotice('Voice input is unavailable right now. You can still type.')
        }

        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        stopVoiceMeter()
        setIsRecording(false)
      }
      recognition.onend = () => {
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
        stopVoiceMeter()
        setIsRecording(false)
      }
      speechRecognitionRef.current = recognition

      setError(null)
      setNotice('')
      setIsRecording(true)
      recognition.start()
    } catch (caughtError) {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
      stopVoiceMeter()
      const message =
        caughtError instanceof Error ? caughtError.message : 'Voice input could not start.'
      setNotice(message)
      setIsRecording(false)
    }
  }

  return (
    <section className="chat-shell">
      <div className="chat-window">
        <div className="chat-window__header">
          <div className="chat-window__identity">
            <h2 className="chat-window__title">LLM chat interface</h2>
            <p className="chat-window__subtitle">
              Ask one focused question, refine with follow-ups, and open sources directly from the
              thread.
            </p>
          </div>
          <p className="chat-window__eyebrow">Conversation Module</p>
        </div>

        <section className="chat-window__suggestions-panel" aria-label="Suggested prompts">
          <div className="chat-window__section-head">
            <span className="chat-window__section-label">Prompt starters</span>
            <span className="chat-window__section-note">One click fills the composer</span>
          </div>
          <div className="chat-window__suggestions">
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
        </section>

        <div className="chat-window__messages-frame">
          <div className="chat-window__section-head">
            <span className="chat-window__section-label">Thread</span>
            <span className="chat-window__section-note">
              Links and sources stay attached to each answer
            </span>
          </div>
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
