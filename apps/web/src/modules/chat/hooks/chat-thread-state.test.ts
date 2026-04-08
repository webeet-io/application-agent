import { describe, expect, it } from 'vitest'
import {
  buildPendingChatSend,
  createAssistantFailureMessage,
  createAssistantSuccessMessage,
  starterMessages,
} from './chat-thread-state'

describe('chat-thread-state', () => {
  it('builds the next outgoing thread from trimmed user input', () => {
    const result = buildPendingChatSend(
      starterMessages,
      '  Need a summary of this role  ',
      false,
      () => 'user-1',
    )

    expect(result).toEqual({
      content: 'Need a summary of this role',
      nextUserMessage: {
        id: 'user-1',
        role: 'user',
        content: 'Need a summary of this role',
      },
      nextMessages: [
        ...starterMessages,
        {
          id: 'user-1',
          role: 'user',
          content: 'Need a summary of this role',
        },
      ],
    })
  })

  it('returns null when the composer is blank or already sending', () => {
    expect(buildPendingChatSend(starterMessages, '   ', false, () => 'ignored')).toBeNull()
    expect(buildPendingChatSend(starterMessages, 'Hello', true, () => 'ignored')).toBeNull()
  })

  it('creates assistant success and failure messages for the thread state', () => {
    expect(
      createAssistantSuccessMessage('Here is the answer', [{ title: 'Docs', url: 'https://x.y' }], () => 'assistant-1'),
    ).toEqual({
      id: 'assistant-1',
      role: 'assistant',
      content: 'Here is the answer',
      sources: [{ title: 'Docs', url: 'https://x.y' }],
    })

    expect(createAssistantFailureMessage(() => 'assistant-2')).toEqual({
      id: 'assistant-2',
      role: 'assistant',
      content: 'I could not answer right now. Check the server configuration and try again.',
    })
  })
})
