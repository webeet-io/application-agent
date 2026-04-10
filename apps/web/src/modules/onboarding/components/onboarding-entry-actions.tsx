'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { OnboardingStep, UserOnboardingStateStatus } from '@ceevee/types'

interface OnboardingEntryActionsProps {
  status: Exclude<UserOnboardingStateStatus, 'profile_ready'>
  sessionId: string | null
  currentStep: OnboardingStep | null
  hasResume: boolean
}

type PendingAction = 'start_resume' | 'skip_resume' | 'upload_resume' | null

function buttonClassName(tone: 'primary' | 'secondary') {
  if (tone === 'primary') {
    return 'rounded-full bg-[linear-gradient(135deg,#cb6e44,#9f4e2b)] px-5 py-3 font-semibold text-[#fffaf6] shadow-[0_12px_24px_rgba(159,78,43,0.22)] transition duration-150 hover:-translate-y-px hover:shadow-[0_16px_28px_rgba(159,78,43,0.28)] disabled:cursor-not-allowed disabled:opacity-50'
  }

  return 'rounded-full border border-[rgba(58,44,33,0.12)] bg-[rgba(255,255,255,0.88)] px-5 py-3 font-semibold text-[#221914] transition duration-150 hover:-translate-y-px hover:border-[rgba(201,109,66,0.28)] hover:bg-[rgba(255,247,241,0.95)] disabled:cursor-not-allowed disabled:opacity-50'
}

export function OnboardingEntryActions({
  status,
  sessionId,
  currentStep,
  hasResume,
}: OnboardingEntryActionsProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [error, setError] = useState<string | null>(null)

  async function startSession(startStep: 'resume_upload' | 'guided_chat') {
    setError(null)
    setPendingAction(startStep === 'resume_upload' ? 'start_resume' : 'skip_resume')

    try {
      const response = await fetch('/api/onboarding/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startStep }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Unable to update onboarding session.')
      }

      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to update onboarding.')
    } finally {
      setPendingAction(null)
    }
  }

  async function uploadResume(file: File) {
    if (!sessionId) {
      setError('Create or resume an onboarding session before uploading a resume.')
      return
    }

    setError(null)
    setPendingAction('upload_resume')

    try {
      const formData = new FormData()
      formData.set('sessionId', sessionId)
      formData.set('file', file)

      const response = await fetch('/api/onboarding/resume', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string | { message?: string }
        } | null
        const message =
          typeof payload?.error === 'string'
            ? payload.error
            : (payload?.error?.message ?? 'Unable to upload onboarding resume.')
        throw new Error(message)
      }

      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : 'Unable to upload onboarding resume.',
      )
    } finally {
      setPendingAction(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="grid gap-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) {
            void uploadResume(file)
          }
        }}
      />

      <div className="flex flex-wrap gap-3">
        {sessionId && currentStep === 'resume_upload' ? (
          <>
            <button
              type="button"
              className={buttonClassName('primary')}
              disabled={pendingAction !== null}
              onClick={() => fileInputRef.current?.click()}
            >
              {pendingAction === 'upload_resume' ? 'Uploading resume...' : 'Upload resume'}
            </button>
            <button
              type="button"
              className={buttonClassName('secondary')}
              disabled={pendingAction !== null}
              onClick={() => void startSession('guided_chat')}
            >
              {pendingAction === 'skip_resume' ? 'Skipping...' : 'Skip for now'}
            </button>
          </>
        ) : !sessionId ? (
          <>
            <button
              type="button"
              className={buttonClassName('primary')}
              disabled={pendingAction !== null}
              onClick={() => void startSession('resume_upload')}
            >
              {pendingAction === 'start_resume' ? 'Starting...' : 'Start with resume'}
            </button>
            <button
              type="button"
              className={buttonClassName('secondary')}
              disabled={pendingAction !== null}
              onClick={() => void startSession('guided_chat')}
            >
              {pendingAction === 'skip_resume' ? 'Preparing...' : 'Skip resume for now'}
            </button>
          </>
        ) : (
          <div className="rounded-[22px] border border-[rgba(58,44,33,0.08)] bg-[rgba(255,255,255,0.74)] px-4 py-4 text-[0.96rem] leading-[1.65] text-[#594b41]">
            {hasResume
              ? 'A resume is already connected to this onboarding session. The next implementation step can move the user into guided questions.'
              : status === 'onboarding_in_progress'
                ? 'This onboarding session is active and currently beyond the upload step. Guided questions can now be connected next.'
                : 'The session is ready to be continued.'}
          </div>
        )}
      </div>

      <p className="m-0 text-[0.92rem] leading-[1.65] text-[#6d6055]">
        On upload, the PDF is now attached to the onboarding session and parsed into plain text when
        extraction succeeds, so guided chat and completion can use real resume context.
      </p>

      {error ? (
        <div className="rounded-[18px] border border-[rgba(159,47,36,0.15)] bg-[rgba(255,243,240,0.92)] px-4 py-3 text-[0.92rem] text-[#9f2f24]">
          {error}
        </div>
      ) : null}
    </div>
  )
}
