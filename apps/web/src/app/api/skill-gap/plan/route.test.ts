import { beforeEach, describe, expect, it, vi } from 'vitest'

const { executeMock, requireApiUserMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
  requireApiUserMock: vi.fn(),
}))

vi.mock('@/infrastructure/container', () => ({
  generateSkillGapPlanUseCase: {
    execute: executeMock,
  },
}))

vi.mock('@/modules/auth/server', () => ({
  requireApiUser: requireApiUserMock,
}))

import { POST } from './route'
import { NextRequest } from 'next/server'

const AUTHED = {
  ok: true as const,
  user: { id: 'user-123' },
}

const UNAUTHED = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }),
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/skill-gap/plan', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/skill-gap/plan', () => {
  beforeEach(() => {
    executeMock.mockReset()
    requireApiUserMock.mockReset()
  })

  it('returns 401 when not authenticated', async () => {
    requireApiUserMock.mockResolvedValue(UNAUTHED)

    const response = await POST(makeRequest({}))

    expect(response.status).toBe(401)
    expect(executeMock).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid JSON body', async () => {
    requireApiUserMock.mockResolvedValue(AUTHED)

    const request = new NextRequest('http://localhost/api/skill-gap/plan', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'invalid JSON' })
    expect(executeMock).not.toHaveBeenCalled()
  })

  it('passes userId from auth to the use case', async () => {
    requireApiUserMock.mockResolvedValue(AUTHED)
    executeMock.mockResolvedValue({ success: true, error: null, value: { strategyMode: 'balanced', prioritizedGaps: [] } })

    await POST(makeRequest({}))

    expect(executeMock).toHaveBeenCalledWith({ userId: 'user-123', strategyModeOverride: undefined })
  })

  it('passes a valid strategyModeOverride to the use case', async () => {
    requireApiUserMock.mockResolvedValue(AUTHED)
    executeMock.mockResolvedValue({ success: true, error: null, value: { strategyMode: 'get_hired_quickly', prioritizedGaps: [] } })

    await POST(makeRequest({ strategyModeOverride: 'get_hired_quickly' }))

    expect(executeMock).toHaveBeenCalledWith({ userId: 'user-123', strategyModeOverride: 'get_hired_quickly' })
  })

  it('ignores an invalid strategyModeOverride', async () => {
    requireApiUserMock.mockResolvedValue(AUTHED)
    executeMock.mockResolvedValue({ success: true, error: null, value: { strategyMode: 'balanced', prioritizedGaps: [] } })

    await POST(makeRequest({ strategyModeOverride: 'not_a_real_mode' }))

    expect(executeMock).toHaveBeenCalledWith({ userId: 'user-123', strategyModeOverride: undefined })
  })

  it('returns 422 when preferences are not found', async () => {
    requireApiUserMock.mockResolvedValue(AUTHED)
    executeMock.mockResolvedValue({
      success: false,
      error: { type: 'preferences_not_found', userId: 'user-123' },
      value: null,
    })

    const response = await POST(makeRequest({}))

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({ error: { type: 'preferences_not_found' } })
  })

  it('returns 422 when resume is not found', async () => {
    requireApiUserMock.mockResolvedValue(AUTHED)
    executeMock.mockResolvedValue({
      success: false,
      error: { type: 'resume_not_found', userId: 'user-123' },
      value: null,
    })

    const response = await POST(makeRequest({}))

    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toMatchObject({ error: { type: 'resume_not_found' } })
  })

  it('returns 422 when resume signals are missing', async () => {
    requireApiUserMock.mockResolvedValue(AUTHED)
    executeMock.mockResolvedValue({
      success: false,
      error: { type: 'resume_signals_missing', userId: 'user-123' },
      value: null,
    })

    const response = await POST(makeRequest({}))

    expect(response.status).toBe(422)
  })

  it('returns 502 for unknown errors', async () => {
    requireApiUserMock.mockResolvedValue(AUTHED)
    executeMock.mockResolvedValue({
      success: false,
      error: { type: 'unknown', message: 'something broke' },
      value: null,
    })

    const response = await POST(makeRequest({}))

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toMatchObject({ error: { type: 'unknown' } })
  })

  it('returns 200 with the plan on success', async () => {
    requireApiUserMock.mockResolvedValue(AUTHED)
    const plan = {
      strategyMode: 'balanced',
      generatedAt: '2026-04-10T00:00:00.000Z',
      prioritizedGaps: [],
      learningPaths: [],
      summary: 'No gaps detected.',
    }
    executeMock.mockResolvedValue({ success: true, error: null, value: plan })

    const response = await POST(makeRequest({}))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(plan)
  })
})
