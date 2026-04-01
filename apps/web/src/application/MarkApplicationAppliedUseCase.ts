import { randomUUID } from 'crypto'
import type { AttemptResult, Application, ApplicationId, JobId, ResumeId } from '@ceevee/types'
import type { IApplicationRepositoryPort } from '@/ports/outbound/IApplicationRepositoryPort'

export type MarkApplicationAppliedError =
  | { type: 'db_error'; message: string }

export interface MarkApplicationAppliedInput {
  userId: string
  jobId: JobId
  resumeId: ResumeId
  notes?: string
}

export class MarkApplicationAppliedUseCase {
  constructor(private readonly applications: IApplicationRepositoryPort) {}

  async execute(input: MarkApplicationAppliedInput): Promise<AttemptResult<MarkApplicationAppliedError, Application>> {
    const application: Application = {
      id: randomUUID() as ApplicationId,
      userId: input.userId,
      jobId: input.jobId,
      resumeId: input.resumeId,
      status: 'applied',
      appliedAt: new Date(),
      notes: input.notes ?? null,
    }

    const result = await this.applications.save(application)
    if (!result.success) {
      return { success: false, error: { type: 'db_error', message: result.error.message }, value: null }
    }

    return { success: true, error: null, value: application }
  }
}
