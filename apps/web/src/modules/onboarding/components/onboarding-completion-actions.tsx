'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OnboardingCompletionPreview } from '@/domain/onboarding-profile'

interface OnboardingCompletionActionsProps {
  sessionId: string
  preview: OnboardingCompletionPreview
}

function buttonClassName(tone: 'primary' | 'secondary') {
  if (tone === 'primary') {
    return 'rounded-full bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] px-5 py-3 font-semibold text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] transition duration-150 hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)] disabled:cursor-not-allowed disabled:opacity-50'
  }

  return 'rounded-full border border-[rgba(58,44,33,0.12)] bg-[rgba(255,255,255,0.88)] px-5 py-3 font-semibold text-[#221914] transition duration-150 hover:-translate-y-px hover:border-[rgba(201,109,66,0.28)] hover:bg-[rgba(255,247,241,0.95)] disabled:cursor-not-allowed disabled:opacity-50'
}

function signalCardClassName(met: boolean) {
  if (met) {
    return 'border-[rgba(86,134,108,0.16)] bg-[rgba(240,249,242,0.9)] text-[#234a2f]'
  }

  return 'border-[rgba(167,126,42,0.14)] bg-[rgba(255,249,238,0.9)] text-[#6d5b2d]'
}

export function OnboardingCompletionActions({
  sessionId,
  preview,
}: OnboardingCompletionActionsProps) {
  const router = useRouter()
  const [pendingAction, setPendingAction] = useState<'complete' | 'force' | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function complete(force: boolean) {
    setPendingAction(force ? 'force' : 'complete')
    setError(null)

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, force }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; redirectTo?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to complete onboarding.')
      }

      router.push(payload?.redirectTo ?? '/opportunities')
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to complete onboarding.')
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.78)] px-4 py-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#8d7667]">
              Completion status
            </p>
            <h3 className="mt-2 text-[1.18rem] leading-tight text-[#221914]">
              {preview.isReadyForCompletion
                ? 'Enough context is available to create the first career profile.'
                : 'A bit more context would improve the first career profile.'}
            </h3>
          </div>
          <div className="rounded-full border border-[rgba(58,44,33,0.12)] bg-[rgba(255,255,255,0.88)] px-4 py-2 text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-[#7d3f23]">
            {preview.completenessScore}% readiness
          </div>
        </div>
        <p className="mt-3 text-[0.96rem] leading-[1.7] text-[#594b41]">{preview.summary}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {preview.signals.map((signal) => (
          <article
            key={signal.id}
            className={`rounded-[20px] border px-4 py-4 ${signalCardClassName(signal.met)}`}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="m-0 text-[0.74rem] font-bold uppercase tracking-[0.12em]">
                {signal.label}
              </p>
              <span className="rounded-full bg-[rgba(255,255,255,0.66)] px-3 py-1 text-[0.74rem] font-semibold uppercase tracking-[0.1em]">
                {signal.met ? 'ready' : 'missing'}
              </span>
            </div>
            <p className="mt-2 text-[0.95rem] leading-[1.6]">{signal.detail}</p>
          </article>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {preview.isReadyForCompletion ? (
          <button
            type="button"
            className={buttonClassName('primary')}
            disabled={pendingAction !== null}
            onClick={() => void complete(false)}
          >
            {pendingAction === 'complete'
              ? 'Creating profile...'
              : 'Create profile and continue'}
          </button>
        ) : null}
        <button
          type="button"
          className={buttonClassName('secondary')}
          disabled={pendingAction !== null}
          onClick={() => void complete(true)}
        >
          {pendingAction === 'force'
            ? 'Continuing anyway...'
            : preview.isReadyForCompletion
              ? 'Skip and continue anyway'
              : 'Skip remaining questions and continue'}
        </button>
      </div>

      <p className="m-0 text-[0.92rem] leading-[1.65] text-[#6d6055]">
        The current implementation creates a first stable career profile from resume context and
        onboarding answers, then hands the user off to opportunities.
      </p>

      {error ? (
        <div className="rounded-[18px] border border-[rgba(159,47,36,0.15)] bg-[rgba(255,243,240,0.92)] px-4 py-3 text-[0.92rem] text-[#9f2f24]">
          {error}
        </div>
      ) : null}
    </div>
  )
}
