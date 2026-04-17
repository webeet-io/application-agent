import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { executeMock, createClientMock, getUserMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  createClientMock: vi.fn(),
  getUserMock: vi.fn(),
}))

vi.mock('@/infrastructure/container', () => ({
  updateApplicationStatusUseCase: {
    execute: executeMock,
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

import { PATCH } from './route'

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/applications/app-1/status', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('PATCH /api/applications/[id]/status', () => {
  beforeEach(() => {
    executeMock.mockReset()
    createClientMock.mockReset()
    getUserMock.mockReset()

    createClientMock.mockResolvedValue({
      auth: {
        getUser: getUserMock,
      },
    })
  })

  it('returns 401 when not authenticated', async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'unauthorized' },
    })

    const response = await PATCH(makeRequest({ status: 'interview' }), { params: { id: 'app-1' } })

    expect(response.status).toBe(401)
    expect(executeMock).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid JSON bodies', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const request = new NextRequest('http://localhost/api/applications/app-1/status', {
      method: 'PATCH',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PATCH(request, { params: { id: 'app-1' } })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'invalid JSON' })
    expect(executeMock).not.toHaveBeenCalled()
  })

  it('returns 400 when status is missing', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const response = await PATCH(makeRequest({}), { params: { id: 'app-1' } })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'status is required' })
    expect(executeMock).not.toHaveBeenCalled()
  })

  it('rejects no_response at the route boundary', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })

    const response = await PATCH(makeRequest({ status: 'no_response' }), { params: { id: 'app-1' } })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'invalid status' })
    expect(executeMock).not.toHaveBeenCalled()
  })

  it('normalizes supported statuses and passes the session user to the use case', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    executeMock.mockResolvedValue({
      success: true,
      error: null,
      value: undefined,
    })

    const response = await PATCH(makeRequest({ status: 'INTERVIEW' }), { params: { id: 'app-1' } })

    expect(response.status).toBe(200)
    expect(executeMock).toHaveBeenCalledWith('app-1', 'user-1', 'interview')
  })

  it('returns 404 when the application is not found', async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    })
    executeMock.mockResolvedValue({
      success: false,
      error: { type: 'not_found', id: 'app-1' },
      value: null,
    })

    const response = await PATCH(makeRequest({ status: 'offer' }), { params: { id: 'app-1' } })

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toMatchObject({
      error: { type: 'not_found', id: 'app-1' },
    })
  })
})
