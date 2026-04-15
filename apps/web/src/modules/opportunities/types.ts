export type OpportunityMatchBand = 'excellent' | 'strong' | 'review'

export type Opportunity = {
  id: string
  companyName: string
  roleTitle: string
  location: string
  matchPercentage: number
  matchReason: string
  applyUrl?: string
  applied: boolean
  sourceCompanyReason?: string
}

export type OpportunityFeedSummary = {
  totalCount: number
  averageMatchPercentage: number
  topMatchPercentage: number
  appliedCount: number
}
