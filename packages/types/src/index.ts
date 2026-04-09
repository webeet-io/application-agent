// Result type for explicit error handling at I/O boundaries
export type AttemptResult<E, T> =
  | { success: true; error: null; value: T }
  | { success: false; error: E; value: null }

// Branded ID types — prevent passing wrong ID type at compile time
export type ResumeId = string & { readonly _brand: 'ResumeId' }
export type CompanyId = string & { readonly _brand: 'CompanyId' }
export type JobId = string & { readonly _brand: 'JobId' }
export type ApplicationId = string & { readonly _brand: 'ApplicationId' }

export interface Resume {
  id: ResumeId
  userId: string
  label: string
  fileUrl: string
  storagePath: string
  originalFileName: string
  mimeType: string
  sizeBytes: number
  createdAt: Date
}

// Global ATS providers + German-market providers (Personio, Softgarden, d.vinci are common in DE)
export type ATSProvider =
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'ashby'
  | 'personio'
  | 'softgarden'
  | 'dvinci'
  | 'unknown'

export interface Company {
  id: CompanyId
  name: string
  careersUrl: string
  atsProvider: ATSProvider
}

export interface Job {
  id: JobId
  companyId: CompanyId
  title: string
  location: string
  description: string
  url: string
  fetchedAt: Date
}

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'rejected' | 'offer' | 'withdrawn'

export interface Application {
  id: ApplicationId
  userId: string
  jobId: JobId
  resumeId: ResumeId
  status: ApplicationStatus
  appliedAt: Date | null
  notes: string | null
}

export interface JobMatch {
  jobId: JobId
  resumeId: ResumeId
  score: number
  reasoning: string
  suggestedTweaks: string[]
}

export type RequirementPriority = 'core' | 'supporting' | 'nice_to_have'
export type MatchQuality = 'direct' | 'transferable' | 'inferable' | 'missing'
export type EvidenceStrength =
  | 'explicit_achievement'
  | 'work_experience'
  | 'project'
  | 'skills_section'
  | 'education'
  | 'inferred'
export type ExperienceDepth =
  | 'theory'
  | 'small_project'
  | 'multiple_projects'
  | 'work_usage'
  | 'ownership'
export type SeniorityLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'staff' | 'lead'
export type SeniorityFit = 'aligned' | 'slightly_below' | 'clearly_below' | 'overqualified'
export type Learnability = 'fast' | 'moderate' | 'structural'
export type EvidenceQuality = 'strong' | 'mixed' | 'weak'
export type OverallMatchLevel = 'strong' | 'promising' | 'stretch' | 'low' | 'blocked'
export type ScoreBand = 'low' | 'medium' | 'high'
export type MatchDisplayTone = 'danger' | 'warning' | 'success'
export type MatchGapSeverity = 'critical' | 'moderate' | 'low'
export type MatchGapType = 'critical_gap' | 'learnable_gap' | 'presentation_gap'
export type SkillLearningPriority = 'high' | 'medium' | 'low'
export type DivergenceLevel = 'low' | 'moderate' | 'high'
export type CareerProfileSkillSource =
  | 'resume'
  | 'user_input'
  | 'work_experience'
  | 'project'
  | 'education'
  | 'skills_section'

export interface ResumeSkillEvidence {
  skill: string
  aliases?: string[]
  relatedSkills?: string[]
  source: 'work_experience' | 'project' | 'achievement' | 'skills_section' | 'education'
  summary: string
  strength: EvidenceStrength
  depth: ExperienceDepth
  yearsOfExperience?: number
}

export interface CareerProfileSkillEvidence {
  skill: string
  aliases?: string[]
  relatedSkills?: string[]
  source: CareerProfileSkillSource
  evidenceText: string
  strength: EvidenceStrength
  depth: ExperienceDepth
  yearsOfExperience?: number
  confidence?: number
  visibleOnResume?: boolean
}

export interface CareerProfileWorkExperience {
  title: string
  company?: string
  summary: string
  skills?: string[]
}

export interface CareerProfileProject {
  name: string
  summary: string
  skills?: string[]
}

export interface CareerProfileEducation {
  label: string
  summary?: string
  skills?: string[]
}

export interface CareerProfilePreferences {
  targetRoles?: string[]
  locations?: string[]
  remotePreference?: 'remote' | 'hybrid' | 'onsite' | 'flexible'
}

export interface CareerProfile {
  userId: string
  label?: string
  seniority: SeniorityLevel
  languages: string[]
  preferences?: CareerProfilePreferences
  skillEvidence: CareerProfileSkillEvidence[]
  workExperience?: CareerProfileWorkExperience[]
  projects?: CareerProfileProject[]
  education?: CareerProfileEducation[]
  additionalNotes?: string
}

export interface ResumeProfile {
  resumeId?: ResumeId
  label?: string
  targetRoles?: string[]
  seniority: SeniorityLevel
  languages: string[]
  locations?: string[]
  skillEvidence: ResumeSkillEvidence[]
}

export interface JobRequirement {
  id: string
  skill: string
  priority: RequirementPriority
  isKnockout?: boolean
  alternatives?: string[]
  relatedSkills?: string[]
  inferableFromSkills?: string[]
  minimumDepth?: ExperienceDepth
  learnability?: Learnability
}

export interface JobLocationConstraint {
  mode: 'remote' | 'hybrid' | 'onsite'
  allowedLocations?: string[]
}

export interface NormalizedJobPosting {
  jobId?: JobId
  title: string
  requiredLanguages: string[]
  locationConstraint?: JobLocationConstraint
  seniority: SeniorityLevel
  requirements: JobRequirement[]
}

export interface KnockoutAssessment {
  blocked: boolean
  reasons: string[]
}

export interface RequirementAssessment {
  requirementId: string
  skill: string
  priority: RequirementPriority
  matchQuality: MatchQuality
  matchedBy?: string
  evidenceStrength?: EvidenceStrength
  experienceDepth?: ExperienceDepth
  confidence: number
  reasoning: string
  learnability?: Learnability
  isKnockout?: boolean
}

export interface ResumeJobFitResult {
  overallScore: number
  scoreBand: ScoreBand
  overallMatchLevel: OverallMatchLevel
  knockout: KnockoutAssessment
  seniorityFit: SeniorityFit
  evidenceQuality: EvidenceQuality
  strengths: string[]
  criticalGaps: string[]
  learnableGaps: string[]
  reasoningSummary: string
  resumeImprovementSuggestions: string[]
  recommendedSkillsToLearnNext: string[]
  requirementAssessments: RequirementAssessment[]
}

export interface MatchOutputItem {
  label: string
  description: string
  priority?: RequirementPriority
}

export interface MatchWeaknessItem extends MatchOutputItem {
  severity: MatchGapSeverity
  type: MatchGapType
}

export interface RecommendedSkillItem {
  skill: string
  reason: string
  priority: SkillLearningPriority
}

export interface DefaultResumeMatchOutput {
  overallScore: number
  scoreBand: ScoreBand
  displayTone: MatchDisplayTone
  title: string
  shortSummary: string
  strengths: MatchOutputItem[]
  weaknesses: MatchWeaknessItem[]
  recommendedImprovements: string[]
  recommendedSkillsToLearn: RecommendedSkillItem[]
}

export interface AiResumeMatchResult {
  overallScore: number
  overallMatchLevel: OverallMatchLevel
  confidence: number
  strengths: MatchOutputItem[]
  weaknesses: MatchWeaknessItem[]
  shortSummary: string
  recommendedImprovements: string[]
  recommendedSkillsToLearn: RecommendedSkillItem[]
}

export interface MatchComparisonResult {
  fallbackScore: number
  aiScore: number
  scoreDifference: number
  divergenceLevel: DivergenceLevel
  reviewFlag: boolean
}

export interface CombinedResumeMatchOutput {
  overallScore: number
  scoreBand: ScoreBand
  displayTone: MatchDisplayTone
  title: string
  shortSummary: string
  strengths: MatchOutputItem[]
  weaknesses: MatchWeaknessItem[]
  recommendedImprovements: string[]
  recommendedSkillsToLearn: RecommendedSkillItem[]
}

export interface CombinedResumeMatchResult {
  fallbackResult: ResumeJobFitResult
  fallbackOutput: DefaultResumeMatchOutput
  aiResult: AiResumeMatchResult
  comparison: MatchComparisonResult
  combinedOutput: CombinedResumeMatchOutput
}
