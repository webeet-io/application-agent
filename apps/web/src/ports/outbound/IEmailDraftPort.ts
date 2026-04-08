import type { AttemptResult } from '@ceevee/types'

export type DraftOutreachInput = {
  jobTitle: string
  jobDescription: string
  companyName: string
  companyContext?: string
  resumeHighlights: string
  contactName: string
  contactTitle: string
}

export type DraftOutreachError =
  | { type: 'llm_failed'; message: string }

export type DraftOutreachResult = {
  subject: string
  body: string
}

export interface IEmailDraftPort {
  draft(input: DraftOutreachInput): Promise<AttemptResult<DraftOutreachError, DraftOutreachResult>>
}
