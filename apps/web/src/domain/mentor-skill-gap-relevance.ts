import type {
  MentorSkillGapPreferences,
  NormalizedSeniority,
  NormalizedTitleFamily,
  OpportunitySignalInput,
  ResumeSignalInput,
  SupportedRoleFamily,
} from './mentor-skill-gap'

const TITLE_FAMILY_MATCHERS: Array<{
  pattern: RegExp
  family: NormalizedTitleFamily['normalizedFamily']
  familyConfidence: NormalizedTitleFamily['familyConfidence']
}> = [
  { pattern: /\bmachine learning engineer\b/i, family: 'ai_engineer', familyConfidence: 1 },
  { pattern: /\bai engineer\b/i, family: 'ai_engineer', familyConfidence: 1 },
  { pattern: /\bux designer\b/i, family: 'product_designer', familyConfidence: 1 },
  { pattern: /\bsoftware engineer\b/i, family: 'fullstack_engineer', familyConfidence: 0.5 },
  { pattern: /\bapplication engineer\b/i, family: 'backend_engineer', familyConfidence: 0.5 },
  { pattern: /\bdesigner\b/i, family: 'product_designer', familyConfidence: 0.5 },
  { pattern: /\bfrontend engineer\b/i, family: 'frontend_engineer', familyConfidence: 1 },
  { pattern: /\bfront[- ]end engineer\b/i, family: 'frontend_engineer', familyConfidence: 1 },
  { pattern: /\bbackend engineer\b/i, family: 'backend_engineer', familyConfidence: 1 },
  { pattern: /\bback[- ]end engineer\b/i, family: 'backend_engineer', familyConfidence: 1 },
  { pattern: /\bfullstack engineer\b/i, family: 'fullstack_engineer', familyConfidence: 1 },
  { pattern: /\bfull[- ]stack engineer\b/i, family: 'fullstack_engineer', familyConfidence: 1 },
  { pattern: /\bdevops engineer\b/i, family: 'devops_platform_engineer', familyConfidence: 1 },
  { pattern: /\bplatform engineer\b/i, family: 'devops_platform_engineer', familyConfidence: 1 },
  { pattern: /\bsolutions engineer\b/i, family: 'other', familyConfidence: 0 },
  { pattern: /\bengineer\b/i, family: 'other', familyConfidence: 0 },
]

const SENIORITY_MATCHERS: Array<{
  pattern: RegExp
  seniority: NormalizedSeniority
  confidence: NormalizedTitleFamily['seniorityConfidence']
}> = [
  { pattern: /\bintern\b/i, seniority: 'intern', confidence: 1 },
  { pattern: /\bjunior\b/i, seniority: 'junior', confidence: 1 },
  { pattern: /\bmid\b/i, seniority: 'mid', confidence: 1 },
  { pattern: /\bmiddle\b/i, seniority: 'mid', confidence: 1 },
  { pattern: /\bsenior\b/i, seniority: 'senior', confidence: 1 },
  { pattern: /\bstaff\b/i, seniority: 'staff_plus', confidence: 1 },
  { pattern: /\bprincipal\b/i, seniority: 'staff_plus', confidence: 1 },
  { pattern: /\blead\b/i, seniority: 'staff_plus', confidence: 1 },
]

const SENIORITY_ORDER: NormalizedSeniority[] = ['intern', 'junior', 'mid', 'senior', 'staff_plus']

export type RelevantJobScore = {
  titleFamilyPoints: 0 | 0.5
  seniorityPoints: 0 | 0.1 | 0.2
  roleSignalPoints: 0 | 0.2
  relevanceToTarget: number
}

export const normalizeTitleFamily = (rawTitle: string): NormalizedTitleFamily => {
  const familyMatch = TITLE_FAMILY_MATCHERS.find((candidate) => candidate.pattern.test(rawTitle))
  const seniorityMatch = SENIORITY_MATCHERS.find((candidate) => candidate.pattern.test(rawTitle))

  return {
    rawTitle,
    normalizedFamily: familyMatch?.family ?? 'other',
    normalizedSeniority: seniorityMatch?.seniority ?? 'unknown',
    familyConfidence: familyMatch?.familyConfidence ?? 0,
    seniorityConfidence: seniorityMatch?.confidence ?? 0,
  }
}

export const isSupportedRoleFamily = (
  family: NormalizedTitleFamily['normalizedFamily'],
): family is SupportedRoleFamily => family !== 'other'

export const isSeniorityWithinOneBand = (
  candidate: NormalizedSeniority,
  target: NormalizedSeniority,
): boolean => {
  if (candidate === 'unknown' || target === 'unknown') {
    return false
  }

  const candidateIndex = SENIORITY_ORDER.indexOf(candidate)
  const targetIndex = SENIORITY_ORDER.indexOf(target)

  return Math.abs(candidateIndex - targetIndex) <= 1
}

export const computeRelevantJobScore = (
  opportunity: OpportunitySignalInput,
  preferences: MentorSkillGapPreferences,
  resume: ResumeSignalInput,
): RelevantJobScore => {
  const titleFamilyMatches = preferences.targetRoleFamilies.includes(
    opportunity.normalizedTitle.normalizedFamily as SupportedRoleFamily,
  )

  const titleFamilyPoints: RelevantJobScore['titleFamilyPoints'] = titleFamilyMatches ? 0.5 : 0

  const seniorityPoints: RelevantJobScore['seniorityPoints'] =
    opportunity.normalizedTitle.normalizedSeniority === preferences.targetSeniority
      ? 0.2
      : isSeniorityWithinOneBand(opportunity.normalizedTitle.normalizedSeniority, preferences.targetSeniority)
        ? 0.1
        : 0

  const normalizedResumeRoleSignals = new Set(resume.roleSignals.map((signal) => signal.trim().toLowerCase()))
  const roleSignalOverlap = opportunity.signalsMentioned.some((signal) =>
    normalizedResumeRoleSignals.has(signal.trim().toLowerCase()),
  )
  const roleSignalPoints: RelevantJobScore['roleSignalPoints'] = roleSignalOverlap ? 0.2 : 0

  return {
    titleFamilyPoints,
    seniorityPoints,
    roleSignalPoints,
    relevanceToTarget: Number((titleFamilyPoints + seniorityPoints + roleSignalPoints).toFixed(2)),
  }
}

export const isRelevantJob = (
  opportunity: OpportunitySignalInput,
  preferences: MentorSkillGapPreferences,
  resume: ResumeSignalInput,
): boolean => {
  const score = computeRelevantJobScore(opportunity, preferences, resume)

  if (!isSupportedRoleFamily(opportunity.normalizedTitle.normalizedFamily)) {
    return false
  }

  if (!preferences.targetRoleFamilies.includes(opportunity.normalizedTitle.normalizedFamily)) {
    return false
  }

  if (!isSeniorityWithinOneBand(opportunity.normalizedTitle.normalizedSeniority, preferences.targetSeniority)) {
    return false
  }

  return score.relevanceToTarget >= 0.6
}

export const isSparseResumeSignalInput = (resume: ResumeSignalInput): boolean =>
  resume.skills.length < 3 || resume.experienceSignals.length < 2 || resume.roleSignals.length === 0
