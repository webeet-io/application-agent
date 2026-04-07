import type { AttemptResult } from '@ceevee/types'
import type { MentorSkillGapPreferences } from '@/domain/mentor-skill-gap'

export type MentorSkillGapPreferencePortError =
  | { type: 'not_found'; userId: string }
  | { type: 'source_failed'; message: string }

export interface IMentorSkillGapPreferencePort {
  findPreferencesByUser(userId: string): Promise<AttemptResult<MentorSkillGapPreferencePortError, MentorSkillGapPreferences>>
}
