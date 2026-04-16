import type { AttemptResult } from '@ceevee/types'
import type { LearningProgressEvent } from '@/domain/mentor-skill-gap'

export type LearningProgressPortError =
  | { type: 'unavailable'; message: string }
  | { type: 'source_failed'; message: string }

export interface ILearningProgressPort {
  listEventsForUser(userId: string): Promise<AttemptResult<LearningProgressPortError, LearningProgressEvent[]>>
}
