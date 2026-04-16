import type { AttemptResult } from '@ceevee/types'
import type { UserDeclaredSkillInput } from '@/domain/mentor-skill-gap'

export type UserDeclaredSkillPortError =
  | { type: 'unavailable'; message: string }
  | { type: 'source_failed'; message: string }

export interface IUserDeclaredSkillPort {
  findDeclaredSkillsByUser(userId: string): Promise<AttemptResult<UserDeclaredSkillPortError, UserDeclaredSkillInput[]>>
}
