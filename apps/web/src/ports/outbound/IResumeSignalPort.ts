import type { AttemptResult } from '@ceevee/types'
import type { ResumeSignalInput } from '@/domain/mentor-skill-gap'

export type ResumeSignalPortError =
  | { type: 'resume_not_found'; userId: string }
  | { type: 'resume_signals_missing'; userId: string }
  | { type: 'source_failed'; message: string }

export interface IResumeSignalPort {
  findCurrentResumeSignalsByUser(userId: string): Promise<AttemptResult<ResumeSignalPortError, ResumeSignalInput>>
}
