import { AttemptResult } from '@ceevee/types'

export interface IEmbeddingPort {
  generate(text: string): Promise<AttemptResult<{ type: 'api_error'; message: string }, number[]>>
}