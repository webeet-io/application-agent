import type { IMatchEnginePort, MatchResult, MatchEngineError } from '@/ports/outbound/IMatchEnginePort'
import type { AttemptResult } from '@ceevee/types'

export class OpenAIMatchEngineAdapter implements IMatchEnginePort {
  async match(_jobDescription: string, _resumeText: string): Promise<AttemptResult<MatchEngineError, MatchResult>> {
    throw new Error('Not implemented')
  }
}
