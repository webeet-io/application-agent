import type { Opportunity, OpportunityFeedSummary, OpportunityMatchBand } from './types'

export function getOpportunityMatchBand(matchPercentage: number): OpportunityMatchBand {
  if (matchPercentage >= 90) return 'excellent'
  if (matchPercentage >= 80) return 'strong'
  return 'review'
}

export function rankOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return [...opportunities].sort((left, right) => {
    if (right.matchPercentage !== left.matchPercentage) {
      return right.matchPercentage - left.matchPercentage
    }

    return left.companyName.localeCompare(right.companyName)
  })
}

export function summarizeOpportunities(opportunities: Opportunity[]): OpportunityFeedSummary {
  if (opportunities.length === 0) {
    return {
      totalCount: 0,
      averageMatchPercentage: 0,
      topMatchPercentage: 0,
      appliedCount: 0,
    }
  }

  const totalMatchPercentage = opportunities.reduce(
    (total, opportunity) => total + opportunity.matchPercentage,
    0
  )

  return {
    totalCount: opportunities.length,
    averageMatchPercentage: Math.round(totalMatchPercentage / opportunities.length),
    topMatchPercentage: Math.max(...opportunities.map((opportunity) => opportunity.matchPercentage)),
    appliedCount: opportunities.filter((opportunity) => opportunity.applied).length,
  }
}
