'use client'

import { FormEvent, useState } from 'react'
import type { OnboardingChatMessage, OnboardingStep } from '@ceevee/types'

interface OnboardingGuidedChatProps {
  sessionId: string
  currentStep: OnboardingStep
  initialMessages: OnboardingChatMessage[]
}

const suggestionPrompts = [
  'My most recent role was...',
  'The main skills I used were...',
  'The role I want next is...',
]

function messageCardClassName(role: OnboardingChatMessage['role']) {
  if (role === 'user') {
    return 'justify-self-end max-w-full min-w-0 w-fit md:max-w-[78%] rounded-[20px] border border-[rgba(255,247,240,0.12)] bg-[linear-gradient(135deg,#2e211b,#1f1613)] px-[15px] pt-[14px] pb-[13px] text-[#fff7f0] shadow-[0_12px_32px_rgba(65,46,32,0.08)]'
  }

  return 'justify-self-start max-w-full min-w-0 w-fit md:max-w-[78%] rounded-[20px] border border-[rgba(58,44,33,0.08)] bg-[linear-gradient(180deg,rgba(255,253,248,0.96),rgba(247,240,232,0.92))] px-[15px] pt-[14px] pb-[13px] text-[#221914] shadow-[0_12px_32px_rgba(65,46,32,0.08)]'
}

export function OnboardingGuidedChat({
  sessionId,
  currentStep,
  initialMessages,
}: OnboardingGuidedChatProps) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runChatAction(payload: { action: 'kickoff' } | { action: 'reply'; message: string }) {
    setIsSending(true)
    setError(null)

    try {
      const response = await fetch('/api/onboarding/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ...payload,
        }),
      })

      const data = (await response.json().catch(() => null)) as
        | { error?: string; messages?: OnboardingChatMessage[] }
        | null

      if (!response.ok) {
        throw new Error(data?.error ?? 'Unable to continue onboarding chat.')
      }

      setMessages(data?.messages ?? [])
      if (payload.action === 'reply') {
        setInput('')
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to continue onboarding chat.')
    } finally {
      setIsSending(false)
    }
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const nextMessage = input.trim()
    if (!nextMessage) return

    await runChatAction({
      action: 'reply',
      message: nextMessage,
    })
  }

  return (
    <section className="grid gap-4 rounded-[30px] border border-[rgba(71,53,40,0.11)] bg-[rgba(255,252,248,0.78)] p-5 shadow-[0_18px_50px_rgba(65,46,32,0.08)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
            Guided chat
          </p>
          <h2 className="mt-2 text-[1.55rem] leading-tight text-[#221914]">
            Build the profile through one focused conversation.
          </h2>
        </div>
        <div className="rounded-full border border-[rgba(58,44,33,0.12)] bg-[rgba(255,255,255,0.88)] px-4 py-2 text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-[#7d3f23]">
          {currentStep}
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="grid gap-4 rounded-[24px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.72)] px-5 py-5">
          <p className="m-0 text-[1rem] leading-[1.7] text-[#594b41]">
            Start the guided conversation and CeeVee will begin collecting the information needed
            for your career profile.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void runChatAction({ action: 'kickoff' })}
              disabled={isSending}
              className="rounded-full bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] px-5 py-3 font-semibold text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] transition duration-150 hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? 'Starting guided chat...' : 'Begin guided chat'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 rounded-[24px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.54)] p-4">
          <div className="grid max-h-[420px] content-start gap-3 overflow-y-auto pr-1">
            {messages
              .filter((message) => message.role !== 'system')
              .map((message) => (
                <article
                  key={message.id}
                  className={messageCardClassName(message.role)}
                >
                  <span className="block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[inherit] opacity-70">
                    {message.role === 'assistant' ? 'CeeVee' : 'You'}
                  </span>
                  <div className="mt-1 whitespace-pre-wrap leading-[1.6]">{message.content}</div>
                </article>
              ))}

            {isSending ? (
              <div className="min-w-[120px] justify-self-start rounded-[20px] border border-[rgba(58,44,33,0.08)] bg-[linear-gradient(180deg,rgba(255,253,248,0.96),rgba(247,240,232,0.92))] px-[15px] pt-[14px] pb-[13px] shadow-[0_12px_32px_rgba(65,46,32,0.08)]">
                <span className="block text-[0.68rem] font-bold uppercase tracking-[0.12em] text-[rgba(34,25,20,0.72)]">
                  CeeVee
                </span>
                <div className="mt-2.5 inline-flex gap-1.5" aria-label="Assistant is typing">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[rgba(36,25,20,0.48)]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[rgba(36,25,20,0.48)] [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[rgba(36,25,20,0.48)] [animation-delay:240ms]" />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestionPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => setInput(prompt)}
                className="rounded-full border border-[rgba(58,44,33,0.1)] bg-[rgba(255,255,255,0.82)] px-3 py-2 text-[0.84rem] text-[#594b41] transition duration-150 hover:-translate-y-px hover:border-[rgba(201,109,66,0.28)] hover:bg-[rgba(255,247,241,0.95)]"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="grid gap-3 rounded-[24px] border border-[rgba(58,44,33,0.1)] bg-[#fffdf9] p-4"
            onSubmit={(event) => void submit(event)}
          >
            <label className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]" htmlFor="onboarding-chat-input">
              Your answer
            </label>
            <textarea
              id="onboarding-chat-input"
              className="min-h-[110px] w-full resize-y rounded-[18px] border border-[rgba(58,44,33,0.1)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,252,248,1))] px-[14px] py-3 leading-[1.6] text-[#221914] outline-none"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Share one useful detail at a time. For example: your latest role, strongest skills, target position, or location preference."
              rows={4}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="m-0 text-[0.9rem] leading-[1.6] text-[#6d6055]">
                The conversation is intended to become part of the persistent onboarding record.
              </p>
              <button
                type="submit"
                disabled={isSending || input.trim().length === 0}
                className="rounded-full bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] px-5 py-3 font-semibold text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] transition duration-150 hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send answer
              </button>
            </div>
          </form>
        </div>
      )}

      {error ? (
        <div className="rounded-[18px] border border-[rgba(159,47,36,0.15)] bg-[rgba(255,243,240,0.92)] px-4 py-3 text-[0.92rem] text-[#9f2f24]">
          {error}
        </div>
      ) : null}
    </section>
  )
}
