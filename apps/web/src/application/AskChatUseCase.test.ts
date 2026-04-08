import { describe, expect, it, vi } from 'vitest'
import { AskChatUseCase, askChatUseCaseConfig } from './AskChatUseCase'
import type { ChatMessage, ChatReply } from '@/domain/chat'
import type { ChatAssistantError, IChatAssistantPort } from '@/ports/outbound/IChatAssistantPort'

function createAssistantPortMock(replyResult?: ChatReply): IChatAssistantPort {
  return {
    reply: vi.fn().mockResolvedValue({
      success: true,
      error: null,
      value: replyResult ?? { reply: 'ok', sources: [] },
    }),
  }
}

function createAssistantFailureMock(error: ChatAssistantError): IChatAssistantPort {
  return {
    reply: vi.fn().mockResolvedValue({
      success: false,
      error,
      value: null,
    }),
  }
}

describe('AskChatUseCase', () => {
  it('normalizes messages before delegating to the assistant port', async () => {
    const assistant = createAssistantPortMock()
    const useCase = new AskChatUseCase(assistant)
    const messages: ChatMessage[] = [
      { id: '1', role: 'assistant', content: '  Earlier answer  ' },
      { id: '2', role: 'assistant', content: '   ' },
      { id: '3', role: 'user', content: '  What changed?  ', sources: [{ title: 'x', url: 'y' }] },
    ]

    await useCase.execute(messages)

    expect(assistant.reply).toHaveBeenCalledWith([
      { id: '1', role: 'assistant', content: 'Earlier answer' },
      { id: '3', role: 'user', content: 'What changed?' },
    ])
  })

  it('rejects message histories that do not end with a user message', async () => {
    const assistant = createAssistantPortMock()
    const useCase = new AskChatUseCase(assistant)

    const result = await useCase.execute([
      { id: '1', role: 'user', content: 'Question' },
      { id: '2', role: 'assistant', content: 'Answer' },
    ])

    expect(result).toEqual({
      success: false,
      error: {
        type: 'invalid_message_history',
        message: 'The latest chat message must come from the user.',
      },
      value: null,
    })
    expect(assistant.reply).not.toHaveBeenCalled()
  })

  it('caps the forwarded history to the latest configured messages', async () => {
    const assistant = createAssistantPortMock()
    const useCase = new AskChatUseCase(assistant)
    const messages: ChatMessage[] = Array.from(
      { length: askChatUseCaseConfig.maxHistoryMessages + 3 },
      (_, index) => ({
        id: String(index),
        role: index === askChatUseCaseConfig.maxHistoryMessages + 2 ? 'user' : 'assistant',
        content: `Message ${index}`,
      }),
    )

    await useCase.execute(messages)

    expect(assistant.reply).toHaveBeenCalledTimes(1)
    const forwardedMessages = vi.mocked(assistant.reply).mock.calls[0][0]
    expect(forwardedMessages).toHaveLength(askChatUseCaseConfig.maxHistoryMessages)
    expect(forwardedMessages[0]?.id).toBe('3')
    expect(forwardedMessages.at(-1)?.id).toBe(String(askChatUseCaseConfig.maxHistoryMessages + 2))
  })

  it('maps adapter empty responses to a feature-level empty reply error', async () => {
    const assistant = createAssistantFailureMock({ type: 'empty_response' })
    const useCase = new AskChatUseCase(assistant)

    const result = await useCase.execute([{ id: '1', role: 'user', content: 'Hello' }])

    expect(result).toEqual({
      success: false,
      error: {
        type: 'empty_reply',
        message: 'The assistant returned an empty reply.',
      },
      value: null,
    })
  })

  it('maps adapter call failures to a feature-level availability error', async () => {
    const assistant = createAssistantFailureMock({ type: 'llm_call_failed', message: 'boom' })
    const useCase = new AskChatUseCase(assistant)

    const result = await useCase.execute([{ id: '1', role: 'user', content: 'Hello' }])

    expect(result).toEqual({
      success: false,
      error: {
        type: 'assistant_unavailable',
        message: 'The assistant is currently unavailable. Please try again.',
      },
      value: null,
    })
  })
})
