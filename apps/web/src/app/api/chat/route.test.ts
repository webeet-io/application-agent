import { beforeEach, describe, expect, it, vi } from 'vitest'

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
}))

vi.mock('@/infrastructure/container', () => ({
  askChatUseCase: {
    execute: executeMock,
  },
}))

import { POST } from './route'

describe('POST /api/chat', () => {
  beforeEach(() => {
    executeMock.mockReset()
  })

  it('returns 400 for invalid payloads', async () => {
    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages: [] }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'Invalid chat payload.' })
    expect(executeMock).not.toHaveBeenCalled()
  })

  it('maps invalid message history errors to 400', async () => {
    executeMock.mockResolvedValue({
      success: false,
      error: {
        type: 'invalid_message_history',
        message: 'The latest chat message must come from the user.',
      },
      value: null,
    })

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ id: '1', role: 'user', content: 'Hello' }],
        }),
      }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: 'The latest chat message must come from the user.',
    })
  })

  it('maps empty model responses to 502', async () => {
    executeMock.mockResolvedValue({
      success: false,
      error: { type: 'empty_reply', message: 'The assistant returned an empty reply.' },
      value: null,
    })

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ id: '1', role: 'user', content: 'Hello' }],
        }),
      }),
    )

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'The assistant returned an empty reply.',
    })
  })

  it('maps assistant failures to 502', async () => {
    executeMock.mockResolvedValue({
      success: false,
      error: {
        type: 'assistant_unavailable',
        message: 'The assistant is currently unavailable. Please try again.',
      },
      value: null,
    })

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ id: '1', role: 'user', content: 'Hello' }],
        }),
      }),
    )

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({
      error: 'The assistant is currently unavailable. Please try again.',
    })
  })

  it('returns the reply payload on success', async () => {
    executeMock.mockResolvedValue({
      success: true,
      error: null,
      value: {
        reply: 'Hi there',
        sources: [{ title: 'Docs', url: 'https://example.com' }],
      },
    })

    const response = await POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: [{ id: '1', role: 'user', content: 'Hello' }],
        }),
      }),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      reply: 'Hi there',
      sources: [{ title: 'Docs', url: 'https://example.com' }],
    })
  })
})
