import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OpenAILearningResourceAdapter } from './OpenAILearningResourceAdapter'
import type { LearningResourceRequest } from '@/domain/mentor-skill-gap'

const baseRequest: LearningResourceRequest = {
  gapName: 'TypeScript',
  gapKind: 'hard_skill',
  strategyMode: 'balanced',
  learningObjective: 'Understand generics and utility types',
  bucket: 'now',
}

const validRecommendations = [
  {
    title: 'TypeScript Handbook',
    type: 'documentation',
    reason: 'Authoritative reference.',
    url: 'https://www.typescriptlang.org/docs/',
  },
]

function makeAdapter() {
  return new OpenAILearningResourceAdapter('test-api-key', 'gpt-4o-mini')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockOpenAIResponse(content: string): any {
  return { choices: [{ message: { content } }] }
}

describe('OpenAILearningResourceAdapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns source_unavailable when the OpenAI call throws', async () => {
    const adapter = makeAdapter()
    // @ts-expect-error — accessing private client for test
    vi.spyOn(adapter.client.chat.completions, 'create').mockRejectedValueOnce(new Error('network error'))

    const result = await adapter.recommendResources(baseRequest)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('source_unavailable')
    }
  })

  it('returns recommendation_failed when the response cannot be parsed', async () => {
    const adapter = makeAdapter()
    // @ts-expect-error — accessing private client for test
    vi.spyOn(adapter.client.chat.completions, 'create').mockResolvedValueOnce(
      mockOpenAIResponse('not valid json at all'),
    )

    const result = await adapter.recommendResources(baseRequest)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('recommendation_failed')
    }
  })

  it('returns typed recommendations on a valid response', async () => {
    const adapter = makeAdapter()
    // @ts-expect-error — accessing private client for test
    vi.spyOn(adapter.client.chat.completions, 'create').mockResolvedValueOnce(
      mockOpenAIResponse(JSON.stringify(validRecommendations)),
    )

    const result = await adapter.recommendResources(baseRequest)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value).toHaveLength(1)
      expect(result.value[0].title).toBe('TypeScript Handbook')
      expect(result.value[0].type).toBe('documentation')
    }
  })

  it('handles markdown-fenced JSON in the response', async () => {
    const adapter = makeAdapter()
    const fenced = '```json\n' + JSON.stringify(validRecommendations) + '\n```'
    // @ts-expect-error — accessing private client for test
    vi.spyOn(adapter.client.chat.completions, 'create').mockResolvedValueOnce(
      mockOpenAIResponse(fenced),
    )

    const result = await adapter.recommendResources(baseRequest)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value).toHaveLength(1)
    }
  })

  it('returns recommendation_failed when OpenAI returns an empty string', async () => {
    const adapter = makeAdapter()
    // @ts-expect-error — accessing private client for test
    vi.spyOn(adapter.client.chat.completions, 'create').mockResolvedValueOnce(
      mockOpenAIResponse(''),
    )

    const result = await adapter.recommendResources(baseRequest)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('recommendation_failed')
    }
  })
})
