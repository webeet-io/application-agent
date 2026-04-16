import { describe, it, expect } from 'vitest'
import { buildLearningResourcePrompt, parseLearningResourceRecommendations } from './mentor-learning-resource-prompt'
import type { LearningResourceRequest } from './mentor-skill-gap'

const baseRequest: LearningResourceRequest = {
  gapName: 'TypeScript',
  gapKind: 'hard_skill',
  strategyMode: 'balanced',
  learningObjective: 'Understand generics and utility types',
  bucket: 'now',
}

// ---------------------------------------------------------------------------
// buildLearningResourcePrompt
// ---------------------------------------------------------------------------
describe('buildLearningResourcePrompt', () => {
  it('includes the gap name', () => {
    const prompt = buildLearningResourcePrompt(baseRequest)
    expect(prompt).toContain('TypeScript')
  })

  it('includes the learning objective', () => {
    const prompt = buildLearningResourcePrompt(baseRequest)
    expect(prompt).toContain('Understand generics and utility types')
  })

  it('includes "this week" label for bucket=now', () => {
    const prompt = buildLearningResourcePrompt({ ...baseRequest, bucket: 'now' })
    expect(prompt).toContain('this week')
  })

  it('includes "next 1–4 weeks" label for bucket=next', () => {
    const prompt = buildLearningResourcePrompt({ ...baseRequest, bucket: 'next' })
    expect(prompt).toContain('1–4 weeks')
  })

  it('includes "lower urgency" label for bucket=later', () => {
    const prompt = buildLearningResourcePrompt({ ...baseRequest, bucket: 'later' })
    expect(prompt).toContain('lower urgency')
  })

  it('includes get_hired_quickly framing', () => {
    const prompt = buildLearningResourcePrompt({ ...baseRequest, strategyMode: 'get_hired_quickly' })
    expect(prompt).toContain('portfolio-ready')
  })

  it('includes long_term_growth framing', () => {
    const prompt = buildLearningResourcePrompt({ ...baseRequest, strategyMode: 'long_term_growth' })
    expect(prompt).toContain('deep, long-term')
  })

  it('describes hard_skill kind correctly', () => {
    const prompt = buildLearningResourcePrompt({ ...baseRequest, gapKind: 'hard_skill' })
    expect(prompt).toContain('technical skill')
  })

  it('describes signal kind correctly', () => {
    const prompt = buildLearningResourcePrompt({ ...baseRequest, gapKind: 'signal' })
    expect(prompt).toContain('professional signal')
  })

  it('describes experience kind correctly', () => {
    const prompt = buildLearningResourcePrompt({ ...baseRequest, gapKind: 'experience' })
    expect(prompt).toContain('real-world experience')
  })

  it('instructs the model to return a JSON array', () => {
    const prompt = buildLearningResourcePrompt(baseRequest)
    expect(prompt).toContain('JSON array')
  })
})

// ---------------------------------------------------------------------------
// parseLearningResourceRecommendations
// ---------------------------------------------------------------------------
describe('parseLearningResourceRecommendations', () => {
  const validItem = {
    title: 'TypeScript Handbook',
    type: 'documentation',
    reason: 'Covers the exact concepts needed.',
    url: 'https://www.typescriptlang.org/docs/',
  }

  it('parses a valid JSON array', () => {
    const raw = JSON.stringify([validItem])
    const result = parseLearningResourceRecommendations(raw)
    expect(result).toHaveLength(1)
    expect(result![0].title).toBe('TypeScript Handbook')
    expect(result![0].type).toBe('documentation')
    expect(result![0].url).toBe('https://www.typescriptlang.org/docs/')
  })

  it('parses multiple items', () => {
    const raw = JSON.stringify([validItem, { ...validItem, title: 'Second resource', url: null }])
    const result = parseLearningResourceRecommendations(raw)
    expect(result).toHaveLength(2)
    expect(result![1].url).toBeNull()
  })

  it('accepts null url', () => {
    const raw = JSON.stringify([{ ...validItem, url: null }])
    const result = parseLearningResourceRecommendations(raw)
    expect(result![0].url).toBeNull()
  })

  it('strips markdown code fences', () => {
    const raw = '```json\n' + JSON.stringify([validItem]) + '\n```'
    const result = parseLearningResourceRecommendations(raw)
    expect(result).toHaveLength(1)
  })

  it('returns null for invalid JSON', () => {
    expect(parseLearningResourceRecommendations('not json')).toBeNull()
  })

  it('returns null when root is not an array', () => {
    expect(parseLearningResourceRecommendations(JSON.stringify({ data: [] }))).toBeNull()
  })

  it('returns null when an item has an invalid type', () => {
    const raw = JSON.stringify([{ ...validItem, type: 'podcast' }])
    expect(parseLearningResourceRecommendations(raw)).toBeNull()
  })

  it('returns null when title is missing', () => {
    const raw = JSON.stringify([{ ...validItem, title: '' }])
    expect(parseLearningResourceRecommendations(raw)).toBeNull()
  })

  it('returns null for an empty array', () => {
    expect(parseLearningResourceRecommendations('[]')).toBeNull()
  })
})
