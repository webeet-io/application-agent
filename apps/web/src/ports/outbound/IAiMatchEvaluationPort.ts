import type {
  AiResumeMatchResult,
  AttemptResult,
  CareerProfile,
  DefaultResumeMatchOutput,
  NormalizedJobPosting,
  ResumeJobFitResult,
  ResumeProfile,
} from '@ceevee/types'

export interface AiMatchEvaluationInput {
  careerProfile: CareerProfile
  resumeProfile: ResumeProfile
  job: NormalizedJobPosting
  fallbackResult: ResumeJobFitResult
  fallbackOutput: DefaultResumeMatchOutput
}

export type AiMatchEvaluationError =
  | { type: 'llm_call_failed'; message: string }
  | { type: 'invalid_ai_response'; raw: string }
  | { type: 'not_configured'; message: string }

export interface IAiMatchEvaluationPort {
  evaluate(
    input: AiMatchEvaluationInput,
  ): Promise<AttemptResult<AiMatchEvaluationError, AiResumeMatchResult>>
}
