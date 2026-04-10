import type { AttemptResult } from '@ceevee/types'
import type { LearningResourceRecommendation, LearningResourceRequest } from '@/domain/mentor-skill-gap'

export type LearningResourcePortError =
  | { type: 'source_unavailable' }
  | { type: 'recommendation_failed'; message: string }

export interface ILearningResourcePort {
  recommendResources(
    input: LearningResourceRequest,
  ): Promise<AttemptResult<LearningResourcePortError, LearningResourceRecommendation[]>>
}
