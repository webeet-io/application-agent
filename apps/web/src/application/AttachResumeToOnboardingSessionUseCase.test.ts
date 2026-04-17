import { describe, expect, it, vi } from 'vitest'
import type { AttemptResult, OnboardingSession } from '@ceevee/types'
import { AttachResumeToOnboardingSessionUseCase } from './AttachResumeToOnboardingSessionUseCase'
import { UploadResumeUseCase } from './UploadResumeUseCase'
import type { IOnboardingSessionRepositoryPort } from '@/ports/outbound/IOnboardingSessionRepositoryPort'
import type { IResumeRepositoryPort } from '@/ports/outbound/IResumeRepositoryPort'
import type { IResumeStoragePort } from '@/ports/outbound/IResumeStoragePort'
import type { IResumeTextExtractorPort } from '@/ports/outbound/IResumeTextExtractorPort'

function createUploadResumeUseCase() {
  const storage: IResumeStoragePort = {
    upload: vi.fn().mockResolvedValue({
      success: true,
      error: null,
      value: { storagePath: 'resumes/user/resume.pdf' },
    }),
  }

  const repository: IResumeRepositoryPort = {
    findById: vi.fn(),
    findByUser: vi.fn(),
    delete: vi.fn(),
    save: vi.fn().mockResolvedValue({
      success: true,
      error: null,
      value: undefined,
    }),
  }

  return new UploadResumeUseCase(storage, repository)
}

function createSession(partial?: Partial<OnboardingSession>): OnboardingSession {
  return {
    id: 'session-1' as never,
    userId: 'user-1',
    status: 'in_progress',
    currentStep: 'guided_chat',
    resumeId: 'resume-1' as never,
    resumeText: null,
    profileDraft: null,
    completedAt: null,
    createdAt: new Date('2026-04-10T10:00:00.000Z'),
    updatedAt: new Date('2026-04-10T10:00:00.000Z'),
    ...partial,
  }
}

describe('AttachResumeToOnboardingSessionUseCase', () => {
  it('stores extracted resume text on the onboarding session when parsing succeeds', async () => {
    const uploadResume = createUploadResumeUseCase()
    const onboardingSessions: IOnboardingSessionRepositoryPort = {
      findActiveByUser: vi.fn(),
      createForUser: vi.fn(),
      setCurrentStep: vi.fn(),
      saveProfileDraft: vi.fn(),
      complete: vi.fn(),
      attachResume: vi.fn().mockResolvedValue({
        success: true,
        error: null,
        value: createSession({
          resumeText: 'Senior frontend engineer with React and TypeScript experience.',
        }),
      }),
    }
    const resumeTextExtractor: IResumeTextExtractorPort = {
      extract: vi.fn().mockResolvedValue({
        success: true,
        error: null,
        value: {
          text: 'Senior frontend engineer with React and TypeScript experience.',
          pageCount: 2,
        },
      }),
    }

    const useCase = new AttachResumeToOnboardingSessionUseCase(
      uploadResume,
      onboardingSessions,
      resumeTextExtractor,
    )

    const result = await useCase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      label: 'Resume',
      fileName: 'resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1234,
      content: new TextEncoder().encode('pdf').buffer,
    })

    expect(result.success).toBe(true)
    expect(resumeTextExtractor.extract).toHaveBeenCalledTimes(1)
    expect(onboardingSessions.attachResume).toHaveBeenCalledWith({
      sessionId: 'session-1',
      resumeId: expect.any(String),
      resumeText: 'Senior frontend engineer with React and TypeScript experience.',
      nextStep: 'guided_chat',
    })
  })

  it('falls back to a null resume text when parsing fails but still attaches the uploaded resume', async () => {
    const uploadResume = createUploadResumeUseCase()
    const onboardingSessions: IOnboardingSessionRepositoryPort = {
      findActiveByUser: vi.fn(),
      createForUser: vi.fn(),
      setCurrentStep: vi.fn(),
      saveProfileDraft: vi.fn(),
      complete: vi.fn(),
      attachResume: vi.fn().mockResolvedValue({
        success: true,
        error: null,
        value: createSession(),
      }),
    }
    const resumeTextExtractor: IResumeTextExtractorPort = {
      extract: vi.fn().mockResolvedValue({
        success: false,
        error: { type: 'parse_failed', message: 'parser exploded' },
        value: null,
      } satisfies AttemptResult<{ type: 'parse_failed'; message: string }, never>),
    }

    const useCase = new AttachResumeToOnboardingSessionUseCase(
      uploadResume,
      onboardingSessions,
      resumeTextExtractor,
    )

    const result = await useCase.execute({
      sessionId: 'session-1',
      userId: 'user-1',
      label: 'Resume',
      fileName: 'resume.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1234,
      content: new TextEncoder().encode('pdf').buffer,
    })

    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
    expect(result.value?.session).toEqual(createSession())
    expect(result.value?.resume).toEqual(
      expect.objectContaining({
        userId: 'user-1',
        label: 'Resume',
        fileUrl: 'resumes/user/resume.pdf',
        storagePath: 'resumes/user/resume.pdf',
        originalFileName: 'resume.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1234,
      }),
    )
    expect(onboardingSessions.attachResume).toHaveBeenCalledWith({
      sessionId: 'session-1',
      resumeId: expect.any(String),
      resumeText: null,
      nextStep: 'guided_chat',
    })
  })
})
