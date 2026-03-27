export type SkillGapKind = 'hard_skill' | 'signal' | 'experience'

export type SkillReadinessState = 'unknown' | 'learning' | 'demonstrated' | 'resume_ready'

export type SkillGapSeverity = 'critical' | 'important' | 'useful' | 'optional'

export type SkillGap = {
  name: string
  kind: SkillGapKind
  severity: SkillGapSeverity
  readinessState: SkillReadinessState
  frequencyAcrossJobs: number
  targetRoleRelevance: number
  confidence: number
  reason: string
}

export type LearningRecommendation = {
  gapName: string
  priority: number
  goal: string
  whyNow: string
  suggestedAction: string
}

export type LearningPathStep = {
  order: number
  bucket: 'now' | 'next' | 'later'
  gapName: string
  objective: string
  whyThisStep: string
  exitCriteria: string
}

export type LearningResourceRequest = {
  gapName: string
  gapKind: SkillGapKind
  strategyMode: 'get_hired_quickly' | 'long_term_growth' | 'balanced'
  learningObjective: string
  bucket: LearningPathStep['bucket']
}

export type LearningResourceRecommendation = {
  title: string
  type: 'tutorial' | 'course' | 'documentation' | 'project' | 'exercise' | 'article'
  reason: string
  url: string | null
}
