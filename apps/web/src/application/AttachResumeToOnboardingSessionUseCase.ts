import type { AttemptResult, OnboardingSession, Resume } from '@ceevee/types'
import type {
  IOnboardingSessionRepositoryPort,
  OnboardingSessionRepositoryError,
} from '@/ports/outbound/IOnboardingSessionRepositoryPort'
import type { IResumeTextExtractorPort } from '@/ports/outbound/IResumeTextExtractorPort'
import type { UploadResumeInput } from '@/application/UploadResumeUseCase'
import { UploadResumeUseCase } from '@/application/UploadResumeUseCase'

export type AttachResumeToOnboardingSessionInput = UploadResumeInput & {
  sessionId: string
}

export type AttachResumeToOnboardingSessionError =
  | { type: 'invalid_input'; message: string }
  | { type: 'invalid_file_type'; mimeType: string }
  | { type: 'storage_upload_failed'; message: string }
  | { type: 'db_error'; message: string }

export interface AttachResumeToOnboardingSessionResult {
  session: OnboardingSession
  resume: Resume
}

function toDatabaseMessage(error: OnboardingSessionRepositoryError): string | null {
  if (error.type === 'db_error') {
    return error.message
  }

  return null
}

export class AttachResumeToOnboardingSessionUseCase {
  constructor(
    private readonly uploadResume: UploadResumeUseCase,
    private readonly onboardingSessions: IOnboardingSessionRepositoryPort,
    private readonly resumeTextExtractor: IResumeTextExtractorPort,
  ) {}

  async execute(
    input: AttachResumeToOnboardingSessionInput,
  ): Promise<
    AttemptResult<AttachResumeToOnboardingSessionError, AttachResumeToOnboardingSessionResult>
  > {
    if (!input.sessionId || input.sessionId.trim().length === 0) {
      return {
        success: false,
        error: { type: 'invalid_input', message: 'sessionId is required' },
        value: null,
      }
    }

    const uploadResult = await this.uploadResume.execute(input)
    if (!uploadResult.success) {
      return { success: false, error: uploadResult.error, value: null }
    }

    const resumeTextResult = await this.resumeTextExtractor.extract({
      mimeType: input.mimeType,
      content: input.content,
    })

    const resumeText = resumeTextResult.success ? resumeTextResult.value.text : null

    const sessionResult = await this.onboardingSessions.attachResume({
      sessionId: input.sessionId,
      resumeId: uploadResult.value.id,
      resumeText,
      nextStep: 'guided_chat',
    })

    if (!sessionResult.success) {
      const message = toDatabaseMessage(sessionResult.error)
      return {
        success: false,
        error: { type: 'db_error', message: message ?? 'Unable to attach resume to onboarding.' },
        value: null,
      }
    }

    return {
      success: true,
      error: null,
      value: {
        session: sessionResult.value,
        resume: uploadResult.value,
      },
    }
  }
}
