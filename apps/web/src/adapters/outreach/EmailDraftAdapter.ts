import type { AttemptResult } from '@ceevee/types'
import type { IEmailDraftPort, DraftOutreachError, DraftOutreachInput, DraftOutreachResult } from '@/ports/outbound/IEmailDraftPort'

export class EmailDraftAdapter implements IEmailDraftPort {
  async draft(input: DraftOutreachInput): Promise<AttemptResult<DraftOutreachError, DraftOutreachResult>> {
    return {
      success: false,
      error: { type: 'llm_failed', message: `Draft provider not configured for ${input.companyName}` },
      value: null,
    }
  }
}
