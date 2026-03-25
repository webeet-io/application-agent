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
    if (input.mimeType !== 'application/pdf') {
      return { success: false, error: { type: 'invalid_file_type', mimeType: input.mimeType }, value: null }
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
      fileUrl: uploadResult.value.storagePath,
      storagePath: uploadResult.value.storagePath,
      originalFileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      createdAt,
    }

    const saveResult = await this.repository.save(resume)
    if (!saveResult.success) {
      return { success: false, error: { type: 'db_error', message: saveResult.error.message }, value: null }
    }

    return { success: true, error: null, value: resume }
  }
}
