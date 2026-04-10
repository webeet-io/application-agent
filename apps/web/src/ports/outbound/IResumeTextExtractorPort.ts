import type { AttemptResult } from '@ceevee/types'

export type ResumeTextExtractorError =
  | { type: 'unsupported_file_type'; mimeType: string }
  | { type: 'parse_failed'; message: string }

export interface ResumeTextExtraction {
  text: string
  pageCount?: number
}

export interface IResumeTextExtractorPort {
  extract(input: {
    mimeType: string
    content: ArrayBuffer
  }): Promise<AttemptResult<ResumeTextExtractorError, ResumeTextExtraction>>
}
