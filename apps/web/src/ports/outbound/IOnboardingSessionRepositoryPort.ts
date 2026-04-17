import type { AttemptResult, OnboardingSession, OnboardingStep, ResumeId } from '@ceevee/types'

export type OnboardingSessionRepositoryError =
  | { type: 'not_found'; userId?: string; sessionId?: string }
  | { type: 'db_error'; message: string }

export interface IOnboardingSessionRepositoryPort {
  findActiveByUser(
    userId: string,
  ): Promise<AttemptResult<OnboardingSessionRepositoryError, OnboardingSession>>
  createForUser(input: {
    userId: string
    currentStep: OnboardingStep
  }): Promise<AttemptResult<OnboardingSessionRepositoryError, OnboardingSession>>
  setCurrentStep(input: {
    sessionId: string
    currentStep: OnboardingStep
  }): Promise<AttemptResult<OnboardingSessionRepositoryError, OnboardingSession>>
  attachResume(input: {
    sessionId: string
    resumeId: ResumeId
    resumeText?: string | null
    nextStep?: OnboardingStep
  }): Promise<AttemptResult<OnboardingSessionRepositoryError, OnboardingSession>>
  saveProfileDraft(input: {
    sessionId: string
    profileDraft: OnboardingSession['profileDraft']
    currentStep?: OnboardingStep
  }): Promise<AttemptResult<OnboardingSessionRepositoryError, OnboardingSession>>
  complete(input: {
    sessionId: string
    profileDraft?: OnboardingSession['profileDraft']
  }): Promise<AttemptResult<OnboardingSessionRepositoryError, OnboardingSession>>
}
