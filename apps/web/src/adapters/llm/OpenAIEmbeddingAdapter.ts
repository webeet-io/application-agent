import { OpenAI } from 'openai'
import { IEmbeddingPort } from '../../ports/outbound/IEmbeddingPort'
import { AttemptResult } from '@ceevee/types'
import { env } from '../../infrastructure/env'

export class OpenAIEmbeddingAdapter implements IEmbeddingPort {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })
  }

  async generate(text: string): Promise<AttemptResult<{ type: 'api_error'; message: string }, number[]>> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      })

      return {
        success: true,
        error: null,
        value: response.data[0].embedding,
      }
    } catch (error: any) {
      return {
        success: false,
        error: { type: 'api_error', message: error.message },
        value: null,
      }
    }
  }
}