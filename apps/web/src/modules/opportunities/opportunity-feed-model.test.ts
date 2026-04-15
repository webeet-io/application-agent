import { describe, expect, it } from 'vitest'
import type { Opportunity } from './types'
import {
  getOpportunityMatchBand,
  rankOpportunities,
  summarizeOpportunities,
} from './opportunity-feed-model'

const baseOpportunity: Opportunity = {
  id: 'base',
  companyName: 'Base',
  roleTitle: 'Frontend Engineer',
  location: 'Berlin',
  matchPercentage: 80,
  matchReason: 'Relevant frontend experience.',
  applyUrl: 'https://example.com/base',
  applied: false,
}

describe('opportunity feed model', () => {
  it('labels match scores with confidence bands', () => {
    expect(getOpportunityMatchBand(94)).toBe('excellent')
    expect(getOpportunityMatchBand(86)).toBe('strong')
    expect(getOpportunityMatchBand(72)).toBe('review')
  })

  it('ranks opportunities by match score and then company name', () => {
    const ranked = rankOpportunities([
      { ...baseOpportunity, id: 'b', companyName: 'Beta', matchPercentage: 86 },
      { ...baseOpportunity, id: 'a', companyName: 'Acme', matchPercentage: 86 },
      { ...baseOpportunity, id: 'c', companyName: 'Cedar', matchPercentage: 94 },
    ])

    expect(ranked.map((opportunity) => opportunity.companyName)).toEqual(['Cedar', 'Acme', 'Beta'])
  })

  it('summarizes opportunity counts and match scores', () => {
    expect(
      summarizeOpportunities([
        { ...baseOpportunity, id: 'a', matchPercentage: 94, applied: true },
        { ...baseOpportunity, id: 'b', matchPercentage: 86 },
        { ...baseOpportunity, id: 'c', matchPercentage: 72 },
      ])
    ).toEqual({
      totalCount: 3,
      averageMatchPercentage: 84,
      topMatchPercentage: 94,
      appliedCount: 1,
    })
  })

  it('returns zero summary values for an empty feed', () => {
    expect(summarizeOpportunities([])).toEqual({
      totalCount: 0,
      averageMatchPercentage: 0,
      topMatchPercentage: 0,
      appliedCount: 0,
    })
  })
})
