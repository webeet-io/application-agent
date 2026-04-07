import { describe, it, expect } from 'vitest'
import { buildDiscoveryPrompt, parseDiscoveredCompanies } from './company-discovery'

describe('buildDiscoveryPrompt', () => {
  it('includes the user prompt in the output', () => {
    const result = buildDiscoveryPrompt('Software startups in Berlin')
    expect(result).toContain('Software startups in Berlin')
  })

  it('instructs the LLM to return a JSON array', () => {
    const result = buildDiscoveryPrompt('any prompt')
    expect(result).toContain('JSON array')
  })

  it('specifies the expected shape of each item', () => {
    const result = buildDiscoveryPrompt('any prompt')
    expect(result).toContain('careersUrl')
    expect(result).toContain('reason')
  })
})

describe('parseDiscoveredCompanies', () => {
  it('parses a valid JSON array of companies', () => {
    const raw = JSON.stringify([
      { name: 'Acme', careersUrl: 'https://acme.com/careers', reason: 'Matches criteria' },
    ])
    const result = parseDiscoveredCompanies(raw)
    expect(result).toEqual([
      { name: 'Acme', careersUrl: 'https://acme.com/careers', reason: 'Matches criteria' },
    ])
  })

  it('returns null for invalid JSON', () => {
    expect(parseDiscoveredCompanies('not json')).toBeNull()
  })

  it('returns null when the JSON is not an array', () => {
    expect(parseDiscoveredCompanies(JSON.stringify({ name: 'Acme' }))).toBeNull()
  })

  it('returns null for an empty array', () => {
    expect(parseDiscoveredCompanies('[]')).toBeNull()
  })

  it('filters out items missing required fields', () => {
    const raw = JSON.stringify([
      { name: 'Acme', careersUrl: 'https://acme.com/careers', reason: 'Good match' },
      { name: 'Broken' }, // missing careersUrl and reason
    ])
    const result = parseDiscoveredCompanies(raw)
    expect(result).toHaveLength(1)
    expect(result![0].name).toBe('Acme')
  })

  it('returns null when all items are malformed', () => {
    const raw = JSON.stringify([{ foo: 'bar' }, { baz: 123 }])
    expect(parseDiscoveredCompanies(raw)).toBeNull()
  })
})
