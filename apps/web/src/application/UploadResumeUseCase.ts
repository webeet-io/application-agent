import { randomUUID } from 'crypto'
import type { AttemptResult, Resume, ResumeId } from '@ceevee/types'
import type { IResumeRepositoryPort } from '@/ports/outbound/IResumeRepositoryPort'
import type { IResumeStoragePort } from '@/ports/outbound/IResumeStoragePort'

export type UploadResumeError =
  | { type: 'invalid_file_type'; mimeType: string }
  | { type: 'storage_upload_failed'; message: string }
  | { type: 'db_error'; message: string }

export interface UploadResumeInput {
  userId: string
  label: string
  fileName: string
  mimeType: string
  sizeBytes: number
  content: ArrayBuffer
}

export class UploadResumeUseCase {
  constructor(
    private readonly storage: IResumeStoragePort,
    private readonly repository: IResumeRepositoryPort,
  ) {}

  async execute(input: UploadResumeInput): Promise<AttemptResult<UploadResumeError, Resume>> {
    if (!input.userId || input.userId.trim().length === 0) {
      return { success: false, error: { type: 'db_error', message: 'userId is required' }, value: null }
    }

    if (input.mimeType !== 'application/pdf') {
      return { success: false, error: { type: 'invalid_file_type', mimeType: input.mimeType }, value: null }
    }

    if (!input.fileName || input.fileName.trim().length === 0) {
      return { success: false, error: { type: 'db_error', message: 'fileName is required' }, value: null }
    }

    if (!Number.isFinite(input.sizeBytes) || input.sizeBytes <= 0) {
      return { success: false, error: { type: 'db_error', message: 'sizeBytes must be > 0' }, value: null }
    }

    const resumeId = randomUUID() as ResumeId
    const createdAt = new Date()

    const uploadResult = await this.storage.upload({
      userId: input.userId,
      resumeId,
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      content: input.content,
    })

    if (!uploadResult.success) {
      return { success: false, error: { type: 'storage_upload_failed', message: uploadResult.error.message }, value: null }
    }

    const resume: Resume = {
      id: resumeId,
      userId: input.userId,
      label: input.label,
      // fileUrl stores the storage path; signed URLs are generated on demand.
      fileUrl: uploadResult.value.storagePath,
      storagePath: uploadResult.value.storagePath,
      originalFileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      createdAt,
    }

    const saveResult = await this.repository.save(resume)
    if (!saveResult.success) {
      const message = saveResult.error.type === 'db_error'
        ? saveResult.error.message
        : `Unexpected repository error: ${saveResult.error.type}`

      return { success: false, error: { type: 'db_error', message }, value: null }
    }

    return { success: true, error: null, value: resume }
  }
}
