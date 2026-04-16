import type { AttemptResult } from '@ceevee/types'
import type { OpportunitySignalInput } from '@/domain/mentor-skill-gap'

export type JobOpportunitySignalPortError =
  | { type: 'unavailable'; message: string }
  | { type: 'source_failed'; message: string }

export interface IJobOpportunitySignalPort {
  findOpenOpportunitySignalsForUser(userId: string): Promise<AttemptResult<JobOpportunitySignalPortError, OpportunitySignalInput[]>>
}
