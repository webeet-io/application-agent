import { AttemptResult } from '@ceevee/types'

/**
 * Port for generating vector embeddings from text.
 * This abstracts the LLM provider (OpenAI, etc.) from the business logic.
 */
export interface IEmbeddingPort {
  /**
   * Converts a text string (like job title + description) into a vector.
   * Standard dimension for OpenAI models is 1536.
   */
  generate(text: string): Promise<AttemptResult<{ type: 'api_error'; message: string }, number[]>>
}