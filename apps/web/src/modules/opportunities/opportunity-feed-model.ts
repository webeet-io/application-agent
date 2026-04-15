import type {
  MarkOpportunityAppliedInput,
  Opportunity,
  OpportunityFeedSummary,
  OpportunityMatchBand,
  OpportunitySetIdentity,
} from './types'

export function getOpportunitySetKey(
  opportunities: Opportunity[],
  identity: OpportunitySetIdentity = {}
): string {
  const opportunityKey = opportunities.map((opportunity) => `${opportunity.id}:${opportunity.applied}`).join('|')
  return [identity.resultSetId ?? 'no-result-set', identity.searchPrompt ?? 'no-search-prompt', opportunityKey].join(
    '::'
  )
}

export function getInitialAppliedIds(opportunities: Opportunity[]): Set<string> {
  return new Set(opportunities.filter((opportunity) => opportunity.applied).map(({ id }) => id))
}

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

export function buildMarkOpportunityAppliedInput(opportunity: Opportunity): MarkOpportunityAppliedInput {
  return {
    opportunityId: opportunity.id,
    jobId: opportunity.jobId,
    companyId: opportunity.companyId,
    resumeId: opportunity.resumeId,
    applicationId: opportunity.applicationId,
    companyName: opportunity.companyName,
    roleTitle: opportunity.roleTitle,
    applyUrl: opportunity.applyUrl,
  }
}
