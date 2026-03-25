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
  createdAt: Date
}

export interface Company {
  id: CompanyId
  name: string
  careersUrl: string
  atsProvider: 'greenhouse' | 'lever' | 'workday' | 'ashby' | 'unknown'
}

export interface Job {
  id: JobId
  companyId: CompanyId
  title: string
  location: string
  description: string
  url: string
  scrapedAt: Date
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
