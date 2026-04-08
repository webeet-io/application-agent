import type { AttemptResult } from '@ceevee/types'
import type { IEmailDraftPort, DraftOutreachError, DraftOutreachInput, DraftOutreachResult } from '@/ports/outbound/IEmailDraftPort'

export class DraftOutreachEmailUseCase {
  constructor(private readonly drafting: IEmailDraftPort) {}

  execute(input: DraftOutreachInput): Promise<AttemptResult<DraftOutreachError, DraftOutreachResult>> {
    return this.drafting.draft(input)
  }
}
