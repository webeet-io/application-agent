import type { AttemptResult } from '@ceevee/types'
import type { ApplicationHistorySignalInput } from '@/domain/mentor-skill-gap'

export type SkillGapApplicationHistoryPortError =
  | { type: 'unavailable'; message: string }
  | { type: 'source_failed'; message: string }

export interface ISkillGapApplicationHistoryPort {
  findApplicationHistorySignalsByUser(
    userId: string,
  ): Promise<AttemptResult<SkillGapApplicationHistoryPortError, ApplicationHistorySignalInput[]>>
}
