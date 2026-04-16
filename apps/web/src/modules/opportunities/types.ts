import type { ApplicationId, AttemptResult, CompanyId, JobId, ResumeId } from '@ceevee/types'

export type OpportunityMatchBand = 'excellent' | 'strong' | 'review'

export type Opportunity = {
  id: string
  jobId?: JobId
  companyId?: CompanyId
  resumeId?: ResumeId
  applicationId?: ApplicationId
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

export type OpportunitySetIdentity = {
  resultSetId?: string
  searchPrompt?: string
}

export type MarkOpportunityAppliedInput = {
  opportunityId: string
  jobId?: JobId
  companyId?: CompanyId
  resumeId?: ResumeId
  applicationId?: ApplicationId
  companyName: string
  roleTitle: string
  applyUrl?: string
}

export type MarkOpportunityAppliedError =
  | { type: 'missing_job_reference'; opportunityId: string }
  | { type: 'missing_resume_reference'; opportunityId: string }
  | { type: 'already_applied'; opportunityId: string }
  | { type: 'tracker_unavailable'; message: string }

export type MarkOpportunityAppliedResult = {
  opportunityId: string
  applicationId?: ApplicationId
  status: 'applied'
}

export type OpportunityFeedOutputPort = {
  markApplied(
    input: MarkOpportunityAppliedInput
  ): Promise<AttemptResult<MarkOpportunityAppliedError, MarkOpportunityAppliedResult>>
}
