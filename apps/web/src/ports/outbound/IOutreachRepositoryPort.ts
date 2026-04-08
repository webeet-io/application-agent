import type { AttemptResult } from '@ceevee/types'

export type OutreachStatus = 'drafted' | 'sent' | 'follow_up_due'

export type OutreachRepositoryError =
  | { type: 'not_found'; id: string }
  | { type: 'db_error'; message: string }

export type OutreachLog = {
  id: string
  applicationId: string
  userId: string
  contactName: string
  contactEmail: string
  status: OutreachStatus
  draftedAt: Date
  sentAt?: Date
  notes?: string
}

export interface IOutreachRepositoryPort {
  log(outreach: OutreachLog): Promise<AttemptResult<OutreachRepositoryError, void>>
}
