import type { AttemptResult, ResumeId } from '@ceevee/types'

export type ResumeStorageError =
  | { type: 'upload_failed'; message: string }

export interface ResumeStorageUploadInput {
  userId: string
  resumeId: ResumeId
  fileName: string
  mimeType: string
  sizeBytes: number
  content: ArrayBuffer
}

export interface IResumeStoragePort {
  upload(input: ResumeStorageUploadInput): Promise<AttemptResult<ResumeStorageError, { storagePath: string }>>
}
