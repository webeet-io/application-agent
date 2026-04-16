import { describe, expect, it, vi } from 'vitest'
import type { ApplicationId, AttemptResult } from '@ceevee/types'
import { UpdateApplicationStatusUseCase } from './UpdateApplicationStatusUseCase'
import type {
  ApplicationRepositoryError,
  IApplicationRepositoryPort,
} from '@/ports/outbound/IApplicationRepositoryPort'

describe('UpdateApplicationStatusUseCase', () => {
  it('updates a supported application status', async () => {
    const updateStatus = vi.fn<() => Promise<AttemptResult<ApplicationRepositoryError, void>>>().mockResolvedValue({
      success: true,
      error: null,
      value: undefined,
    })

    const repository: IApplicationRepositoryPort = {
      findById: vi.fn(),
      findByUser: vi.fn(),
      save: vi.fn(),
      updateStatus,
      delete: vi.fn(),
    }

    const useCase = new UpdateApplicationStatusUseCase(repository)
    const result = await useCase.execute('app-1' as ApplicationId, 'user-1', 'interview')

    expect(result).toEqual({ success: true, error: null, value: undefined })
    expect(updateStatus).toHaveBeenCalledWith('app-1', 'user-1', 'interview')
  })

  it('rejects no_response until the schema supports it', async () => {
    const updateStatus = vi.fn()
    const repository: IApplicationRepositoryPort = {
      findById: vi.fn(),
      findByUser: vi.fn(),
      save: vi.fn(),
      updateStatus,
      delete: vi.fn(),
    }

    const useCase = new UpdateApplicationStatusUseCase(repository)
    const result = await useCase.execute('app-1' as ApplicationId, 'user-1', 'no_response')

    expect(result).toEqual({
      success: false,
      error: { type: 'unsupported_outcome', outcome: 'no_response' },
      value: null,
    })
    expect(updateStatus).not.toHaveBeenCalled()
  })

  it('propagates repository not_found errors', async () => {
    const repository: IApplicationRepositoryPort = {
      findById: vi.fn(),
      findByUser: vi.fn(),
      save: vi.fn(),
      updateStatus: vi.fn().mockResolvedValue({
        success: false,
        error: { type: 'not_found', id: 'app-404' },
        value: null,
      } satisfies AttemptResult<ApplicationRepositoryError, void>),
      delete: vi.fn(),
    }

    const useCase = new UpdateApplicationStatusUseCase(repository)
    const result = await useCase.execute('app-404' as ApplicationId, 'user-1', 'offer')

    expect(result).toEqual({
      success: false,
      error: { type: 'not_found', id: 'app-404' },
      value: null,
    })
  })
})
