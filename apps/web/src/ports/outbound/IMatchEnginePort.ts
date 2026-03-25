import type { AttemptResult } from '@ceevee/types'

export type MatchResult = {
  score: number // 0–100
  reasoning: string
  suggestedTweaks: string[]
}

export type MatchEngineError =
  | { type: 'llm_call_failed'; message: string }
  | { type: 'parse_failed'; raw: string }

export interface IMatchEnginePort {
  match(jobDescription: string, resumeText: string): Promise<AttemptResult<MatchEngineError, MatchResult>>
}
