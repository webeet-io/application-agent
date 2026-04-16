export type SkillGapStrategyMode = 'get_hired_quickly' | 'long_term_growth' | 'balanced'

export type SupportedRoleFamily =
  | 'frontend_engineer'
  | 'backend_engineer'
  | 'fullstack_engineer'
  | 'devops_platform_engineer'
  | 'product_designer'
  | 'ai_engineer'

export type NormalizedRoleFamily = SupportedRoleFamily | 'other'

export type NormalizedSeniority = 'intern' | 'junior' | 'mid' | 'senior' | 'staff_plus' | 'unknown'

export type SkillGapKind = 'hard_skill' | 'signal' | 'experience'

export type SkillReadinessState = 'unknown' | 'learning' | 'demonstrated' | 'resume_ready'

export type PriorityBucket = 'critical_now' | 'important_next' | 'strategic_later' | 'optional'

export type LearningPathBucket = 'now' | 'next' | 'later'

export type DegradedMode =
  | 'none'
  | 'single_relevant_job'
  | 'sparse_resume'
  | 'no_history'
  | 'contradictory_user_input'
  | 'low_confidence_only'

export type WhyNowReason =
  | 'high_frequency_across_relevant_jobs'
  | 'high_target_role_alignment'
  | 'blocking_current_applications'
  | 'repeated_missing_in_application_history'
  | 'close_to_resume_ready'
  | 'foundational_for_other_gaps'
  | 'high_long_term_leverage'
  | 'low_effort_high_return'
  | 'contradicted_by_user_input'
  | 'degraded_low_confidence'

export type NormalizedTitleFamily = {
  rawTitle: string
  normalizedFamily: NormalizedRoleFamily
  normalizedSeniority: NormalizedSeniority
  familyConfidence: 0 | 0.5 | 1
  seniorityConfidence: 0 | 0.5 | 1
}

export type ResumeSignalInput = {
  resumeId: string
  userId: string
  skills: string[]
  experienceSignals: string[]
  roleSignals: string[]
}

export type OpportunitySignalInput = {
  jobId: string
  title: string
  normalizedTitle: NormalizedTitleFamily
  skillsMentioned: string[]
  signalsMentioned: string[]
}

export type ApplicationHistorySignalInput = {
  applicationId: string
  jobId: string
  jobTitle: string
  status: 'saved' | 'applied' | 'interview' | 'rejected' | 'offer' | 'withdrawn'
  outcome: string | null
  rejectedReason: string | null
  skillsPresent: string[]
  skillsMissing: string[]
}

export type UserDeclaredSkillInput = {
  name: string
  confidence: 'low' | 'medium' | 'high'
  evidence: string | null
  isOnResume: boolean
}

export type MentorSkillGapPreferences = {
  strategyMode: SkillGapStrategyMode
  targetRoleFamilies: SupportedRoleFamily[]
  targetSeniority: NormalizedSeniority
}

export type LearningProgressEvent = {
  eventId: string
  userId: string
  gapName: string
  gapKind: SkillGapKind
  eventType:
    | 'studied_foundation'
    | 'completed_guided_exercise'
    | 'built_project'
    | 'used_in_real_context'
    | 'completed_exit_criterion'
    | 'self_claimed_skill'
    | 'marked_resume_ready'
    | 'resume_ready_revoked'
  occurredAt: string
  evidenceLevel: 'weak' | 'moderate' | 'strong'
  artifactType: 'none' | 'note' | 'project' | 'repo' | 'portfolio' | 'work_sample'
  artifactUrl: string | null
  relatedStepOrder: number | null
  details: string
}

export type LearningProgressSnapshot = {
  gapName: string
  gapKind: SkillGapKind
  totalEvents: number
  latestEventAt: string | null
  completedStepOrders: number[]
  hasProofBearingArtifact: boolean
  hasUsageEvidence: boolean
  hasExitCriterionCompletion: boolean
  moderateOrStrongEvidenceCount: number
  strongEvidenceCount: number
  artifactContextCount: number
  currentStage: 'not_started' | 'foundation' | 'practice' | 'proof'
}

export type EstimatedEffort = {
  band: 'short' | 'medium' | 'long'
  minWeeks: number
  maxWeeks: number
  anchor: 'foundation_only' | 'foundation_plus_guided_practice' | 'project_proof' | 'real_context_repetition'
  confidence: 'high' | 'medium'
}

export type ResumeReadinessRecommendation = {
  status: 'not_ready' | 'almost_ready' | 'ready_now'
  ruleResults: {
    hasProofBearingArtifact: boolean
    hasCompletedRequiredExitCriterion: boolean
    hasUsageEvidence: boolean
    hasContradictoryEvidence: boolean
    minimumEvidenceCountMet: boolean
  }
  missingRequirements: string[]
  justificationCodes: WhyNowReason[]
  guidance: string
}

export type PrioritizedSkillGap = {
  name: string
  kind: SkillGapKind
  confidence: number
  frequencyAcrossRelevantJobs: number
  jobsMatchedCount: number
  targetRoleRelevance: number
  blockingScore: number
  readinessState: SkillReadinessState
  rankingScore: number
  priorityBucket: PriorityBucket
  whyNow: WhyNowReason[]
  contradictionMarker: boolean
  evidenceSnapshot: {
    presentOnResume: boolean
    presentInProgressLogs: boolean
    presentInUserDeclaration: boolean
    repeatedInApplicationHistory: boolean
    exampleJobTitles: string[]
  }
  recommendation: ResumeReadinessRecommendation
}

export type DetectedRecurringGap = {
  name: string
  kind: SkillGapKind
  frequencyAcrossRelevantJobs: number
  jobsMatchedCount: number
  targetRoleRelevance: number
  confidence: number
  isRecurring: boolean
  contradictionMarker: boolean
  evidence: {
    jobsMatched: number
    exampleJobTitles: string[]
    missingFromResume: boolean
    contradictedByUserInput: boolean
    repeatedInApplicationHistory: boolean
  }
}

export type LearningPathStep = {
  order: number
  bucket: LearningPathBucket
  gapName: string
  objective: string
  stepType: 'foundation' | 'practice' | 'proof'
  exitCriteria: string[]
  estimatedEffort: EstimatedEffort
  whyThisStep: WhyNowReason[]
}

export type LearningPath = {
  gapName: string
  steps: LearningPathStep[]
  totalEstimatedEffort: EstimatedEffort
}

export type LearningResourceRequest = {
  gapName: string
  gapKind: SkillGapKind
  strategyMode: SkillGapStrategyMode
  learningObjective: string
  bucket: LearningPathBucket
}

export type LearningResourceRecommendation = {
  title: string
  type: 'tutorial' | 'course' | 'documentation' | 'project' | 'exercise' | 'article'
  reason: string
  url: string | null
}

export type SkillGapPlan = {
  strategyMode: SkillGapStrategyMode
  generatedAt: string
  inputQuality: {
    hasRelevantJobs: boolean
    relevantJobCount: number
    hasApplicationHistory: boolean
    hasUserDeclaredSkills: boolean
    isSparseResume: boolean
    degradedMode: DegradedMode
    fallbackSummary: string
  }
  prioritizedGaps: PrioritizedSkillGap[]
  learningPaths: LearningPath[]
  resourceRecommendations?: LearningResourceRecommendation[] | undefined
  summary: string
}
