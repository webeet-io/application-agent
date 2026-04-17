import { describe, expect, it, vi } from 'vitest'
import type { Application, AttemptResult } from '@ceevee/types'
import { MarkApplicationAppliedUseCase } from './MarkApplicationAppliedUseCase'
import type {
  ApplicationRepositoryError,
  IApplicationRepositoryPort,
} from '@/ports/outbound/IApplicationRepositoryPort'

describe('MarkApplicationAppliedUseCase', () => {
  it('creates an applied application and saves it through the repository', async () => {
    const save = vi.fn<() => Promise<AttemptResult<ApplicationRepositoryError, void>>>().mockResolvedValue({
      success: true,
      error: null,
      value: undefined,
    })

    const repository: IApplicationRepositoryPort = {
      findById: vi.fn(),
      findByUser: vi.fn(),
      save,
      updateStatus: vi.fn(),
      delete: vi.fn(),
    }

    const useCase = new MarkApplicationAppliedUseCase(repository)
    const result = await useCase.execute({
      userId: 'user-1',
      jobId: 'job-1' as Application['jobId'],
      resumeId: 'resume-1' as Application['resumeId'],
      notes: 'Applied via company website',
    })

    expect(result.success).toBe(true)
    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        jobId: 'job-1',
        resumeId: 'resume-1',
        status: 'applied',
        notes: 'Applied via company website',
      }),
    )
  })

  it('maps repository failures to db_error', async () => {
    const repository: IApplicationRepositoryPort = {
      findById: vi.fn(),
      findByUser: vi.fn(),
      save: vi.fn().mockResolvedValue({
        success: false,
        error: { type: 'db_error', message: 'insert failed' },
        value: null,
      } satisfies AttemptResult<ApplicationRepositoryError, void>),
      updateStatus: vi.fn(),
      delete: vi.fn(),
    }

    const useCase = new MarkApplicationAppliedUseCase(repository)
    const result = await useCase.execute({
      userId: 'user-1',
      jobId: 'job-1' as Application['jobId'],
      resumeId: 'resume-1' as Application['resumeId'],
    })

    expect(result).toEqual({
      success: false,
      error: { type: 'db_error', message: 'insert failed' },
      value: null,
    })
  })
})
