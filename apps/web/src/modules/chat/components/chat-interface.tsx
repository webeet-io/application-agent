'use client'

import { FormEvent, useEffect, useRef } from 'react'
import Image from 'next/image'
import logo from '@/assets/logo.png'
import { renderMessageContent } from '@/modules/chat/lib/render-message-content'
import { useChatThread } from '@/modules/chat/hooks/use-chat-thread'
import { useVoiceInput } from '@/modules/chat/hooks/use-voice-input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ChatMessage } from '@/components/chat-message'
import { TypingIndicator } from '@/components/typing-indicator'
import { cn } from '@/lib/utils'
import { ArrowUp, Mic, MicOff } from 'lucide-react'

export function ChatInterface() {
  const {
    error,
    errorDebugDetail,
    input,
    isSending,
    messageToRevealId,
    messages,
    sendMessage: submitMessage,
    setError,
    setErrorDebugDetail,
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
    onClearError: () => {
      setError(null)
      setErrorDebugDetail(null)
    },
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
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm">
        <Image src={logo} alt="CeeVee" width={32} height={32} className="rounded-lg" />
        <span className="text-sm font-semibold tracking-tight">CeeVee</span>
        <Badge variant="secondary">AI Assistant</Badge>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Image src={logo} alt="CeeVee" width={56} height={56} className="mb-5 rounded-2xl" />
              <h2 className="mb-2 text-xl font-semibold text-foreground">How can I help you?</h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                Ask me about job opportunities, resume feedback, or career guidance.
              </p>
            </div>
          )}

          {messages.map((message) => (
            <article
              key={message.id}
              ref={(el) => {
                messageRefs.current[message.id] = el
              }}
            >
              <ChatMessage role={message.role}>
                <div className="whitespace-pre-wrap">
                  {renderMessageContent(message.content, {
                    linkClassName: cn(
                      'underline underline-offset-2 transition-opacity',
                      message.role === 'user'
                        ? 'opacity-80 hover:opacity-100'
                        : 'text-primary hover:opacity-70'
                    ),
                    rawLinkClassName: 'break-all',
                  })}
                </div>
                {message.role === 'assistant' && message.sources?.length ? (
                  <div className="mt-3 border-t border-border/40 pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sources
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {message.sources.map((source) => (
                        <a
                          key={`${source.url}-${source.title}`}
                          className="flex flex-col gap-0.5 rounded-lg border border-border bg-background px-3 py-2 text-xs transition-colors hover:bg-secondary/40"
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="font-medium text-foreground">{source.title}</span>
                          <span className="break-all text-muted-foreground">{source.url}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </ChatMessage>
            </article>
          ))}

          {isSending && <TypingIndicator />}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background">
        <div className="mx-auto max-w-3xl px-4 pb-4 pt-3">
          {error && (
            <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
              {errorDebugDetail && (
                <details className="group mt-2">
                  <summary className="flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-destructive/80">
                    <span className="transition-transform duration-150 group-open:rotate-180">▾</span>
                    Developer detail
                  </summary>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-md bg-background px-3 py-2 text-xs text-destructive/70">
                    {errorDebugDetail}
                  </pre>
                </details>
              )}
            </div>
          )}
          {notice && <p className="mb-3 text-xs text-muted-foreground">{notice}</p>}

          <form onSubmit={sendMessage}>
            <div className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 transition-[border-color] focus-within:border-primary/40">
              <Textarea
                id="chat-input"
                className="min-h-[36px] flex-1 resize-none border-0 bg-transparent p-0 text-sm leading-relaxed shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void sendMessage()
                  }
                }}
                placeholder="Message CeeVee..."
                rows={1}
              />
              <div className="flex shrink-0 items-center gap-1 pb-0.5">
                {isRecording && (
                  <div className="mr-1 flex h-5 items-end gap-0.5">
                    {voiceLevels.map((level, i) => (
                      <span
                        key={i}
                        className="w-0.5 rounded-full bg-destructive/70 transition-all duration-75"
                        style={{ height: `${Math.max(6, level * 20)}px` }}
                      />
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground',
                    isRecording &&
                      'bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive'
                  )}
                  onClick={() => void toggleRecording()}
                  disabled={isSending}
                  aria-pressed={isRecording}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={isSending || !input.trim()}
                  aria-label="Send message"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground/50">
              Enter to send · Shift+Enter for new line
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
