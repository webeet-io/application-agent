import { describe, expect, it } from 'vitest'
import type { Opportunity } from './types'
import {
  buildMarkOpportunityAppliedInput,
  getInitialAppliedIds,
  getOpportunityMatchBand,
  getOpportunitySetKey,
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

  it('builds initial applied state from incoming opportunities', () => {
    const appliedIds = getInitialAppliedIds([
      { ...baseOpportunity, id: 'a', applied: true },
      { ...baseOpportunity, id: 'b', applied: false },
    ])

    expect([...appliedIds]).toEqual(['a'])
  })

  it('includes applied values in the opportunity set key', () => {
    expect(
      getOpportunitySetKey([
        { ...baseOpportunity, id: 'a', applied: true },
        { ...baseOpportunity, id: 'b', applied: false },
      ])
    ).toBe('no-result-set::no-search-prompt::a:true|b:false')
  })

  it('includes result-set identity in the opportunity set key', () => {
    expect(
      getOpportunitySetKey(
        [
          { ...baseOpportunity, id: 'a', applied: false },
          { ...baseOpportunity, id: 'b', applied: false },
        ],
        { resultSetId: 'discovery-1', searchPrompt: 'healthcare startups in Berlin' }
      )
    ).toBe('discovery-1::healthcare startups in Berlin::a:false|b:false')
  })

  it('builds the outbound applied payload without UI-only fields', () => {
    expect(
      buildMarkOpportunityAppliedInput({
        ...baseOpportunity,
        id: 'opportunity-1',
        companyName: 'Acme',
        roleTitle: 'Frontend Engineer',
        applyUrl: 'https://acme.example/jobs/frontend',
        sourceCompanyReason: 'Matched by discovery context.',
      })
    ).toEqual({
      opportunityId: 'opportunity-1',
      jobId: undefined,
      companyId: undefined,
      resumeId: undefined,
      applicationId: undefined,
      companyName: 'Acme',
      roleTitle: 'Frontend Engineer',
      applyUrl: 'https://acme.example/jobs/frontend',
    })
  })
})
