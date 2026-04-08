import type { AttemptResult, ApplicationId, ApplicationStatus } from '@ceevee/types'
import type { IApplicationRepositoryPort } from '@/ports/outbound/IApplicationRepositoryPort'

export type UpdateApplicationStatusError =
  | { type: 'not_found'; id: string }
  | { type: 'db_error'; message: string }
  | { type: 'unsupported_outcome'; outcome: ApplicationOutcome }

export type ApplicationOutcome = ApplicationStatus | 'no_response'

export class UpdateApplicationStatusUseCase {
  constructor(private readonly applications: IApplicationRepositoryPort) {}

  async execute(
    id: ApplicationId,
    userId: string,
    outcome: ApplicationOutcome,
  ): Promise<AttemptResult<UpdateApplicationStatusError, void>> {
    const normalized = normalizeOutcome(outcome)
    if (!normalized) {
      return { success: false, error: { type: 'unsupported_outcome', outcome }, value: null }
    }

    const result = await this.applications.updateStatus(id, userId, normalized)
    if (!result.success) {
      return { success: false, error: result.error, value: null }
    }

    return { success: true, error: null, value: undefined }
  }
}

function normalizeOutcome(outcome: ApplicationOutcome): ApplicationStatus | null {
  if (outcome === 'no_response') return null
  return outcome
}
