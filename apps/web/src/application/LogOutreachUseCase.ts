import { randomUUID } from 'crypto'
import type { AttemptResult } from '@ceevee/types'
import type { IOutreachRepositoryPort, OutreachLog, OutreachRepositoryError, OutreachStatus } from '@/ports/outbound/IOutreachRepositoryPort'

export type LogOutreachInput = {
  applicationId: string
  userId: string
  contactName: string
  contactEmail: string
  status?: OutreachStatus
  notes?: string
}

export class LogOutreachUseCase {
  constructor(private readonly outreach: IOutreachRepositoryPort) {}

  async execute(input: LogOutreachInput): Promise<AttemptResult<OutreachRepositoryError, OutreachLog>> {
    const outreachLog: OutreachLog = {
      id: randomUUID(),
      applicationId: input.applicationId,
      userId: input.userId,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      status: input.status ?? 'drafted',
      draftedAt: new Date(),
      notes: input.notes,
    }

    const result = await this.outreach.log(outreachLog)
    if (!result.success) return result

    return { success: true, error: null, value: outreachLog }
  }
}
