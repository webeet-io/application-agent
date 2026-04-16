import OpenAI from 'openai'
import type { ILearningResourcePort, LearningResourcePortError } from '@/ports/outbound/ILearningResourcePort'
import type { AttemptResult } from '@ceevee/types'
import type { LearningResourceRecommendation, LearningResourceRequest } from '@/domain/mentor-skill-gap'
import { buildLearningResourcePrompt, parseLearningResourceRecommendations } from '@/domain/mentor-learning-resource-prompt'

// Adapter responsibility: call OpenAI, translate the response into domain types.
// No business logic here — prompt building and response parsing live in the domain.
export class OpenAILearningResourceAdapter implements ILearningResourcePort {
  private readonly client: OpenAI
  private readonly model: string

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey })
    this.model = model
  }

  async recommendResources(
    input: LearningResourceRequest,
  ): Promise<AttemptResult<LearningResourcePortError, LearningResourceRecommendation[]>> {
    let raw: string

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: buildLearningResourcePrompt(input) }],
        temperature: 0.4,
      })
      raw = response.choices[0]?.message?.content ?? ''
    } catch (err) {
      return {
        success: false,
        error: { type: 'source_unavailable' },
        value: null,
      }
    }

    const recommendations = parseLearningResourceRecommendations(raw)
    if (!recommendations) {
      return {
        success: false,
        error: { type: 'recommendation_failed', message: `Unparseable response: ${raw.slice(0, 200)}` },
        value: null,
      }
    }

    return { success: true, error: null, value: recommendations }
  }
}
