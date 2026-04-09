import type {
  EvidenceQuality,
  EvidenceStrength,
  ExperienceDepth,
  JobRequirement,
  MatchQuality,
  NormalizedJobPosting,
  OverallMatchLevel,
  RequirementAssessment,
  ResumeJobFitResult,
  ResumeProfile,
  ResumeSkillEvidence,
  ScoreBand,
  SeniorityFit,
  SeniorityLevel,
} from '@ceevee/types'

const PRIORITY_WEIGHTS = {
  core: 12,
  supporting: 6,
  nice_to_have: 2,
} as const

const MATCH_QUALITY_WEIGHTS: Record<MatchQuality, number> = {
  direct: 1,
  transferable: 0.7,
  inferable: 0.35,
  missing: 0,
}

const EVIDENCE_STRENGTH_WEIGHTS: Record<EvidenceStrength, number> = {
  explicit_achievement: 1,
  work_experience: 0.9,
  project: 0.75,
  skills_section: 0.45,
  education: 0.35,
  inferred: 0.2,
}

const EXPERIENCE_DEPTH_WEIGHTS: Record<ExperienceDepth, number> = {
  theory: 0.3,
  small_project: 0.5,
  multiple_projects: 0.7,
  work_usage: 0.85,
  ownership: 1,
}

const SENIORITY_ORDER: Record<SeniorityLevel, number> = {
  intern: 0,
  junior: 1,
  mid: 2,
  senior: 3,
  staff: 4,
  lead: 5,
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}

function buildSkillIndex(resume: ResumeProfile): Map<string, ResumeSkillEvidence[]> {
  const index = new Map<string, ResumeSkillEvidence[]>()

  for (const evidence of resume.skillEvidence) {
    const keys = unique([
      evidence.skill,
      ...(evidence.aliases ?? []),
    ]).map(normalize)

    for (const key of keys) {
      index.set(key, [...(index.get(key) ?? []), evidence])
    }
  }

  return index
}

function findBestEvidence(
  requirement: JobRequirement,
  skillIndex: Map<string, ResumeSkillEvidence[]>,
): {
  matchQuality: MatchQuality
  evidence?: ResumeSkillEvidence
  matchedBy?: string
} {
  const directCandidates = [
    requirement.skill,
    ...(requirement.alternatives ?? []),
  ].flatMap((skill) => skillIndex.get(normalize(skill)) ?? [])

  if (directCandidates.length > 0) {
    const evidence = pickStrongestEvidence(directCandidates)
    return {
      matchQuality: 'direct',
      evidence,
      matchedBy: evidence.skill,
    }
  }

  const transferableCandidates = (requirement.relatedSkills ?? []).flatMap(
    (skill) => skillIndex.get(normalize(skill)) ?? [],
  )

  if (transferableCandidates.length > 0) {
    const evidence = pickStrongestEvidence(transferableCandidates)
    return {
      matchQuality: 'transferable',
      evidence,
      matchedBy: evidence.skill,
    }
  }

  const inferableCandidates = (requirement.inferableFromSkills ?? []).flatMap(
    (skill) => skillIndex.get(normalize(skill)) ?? [],
  )

  if (inferableCandidates.length > 0) {
    const evidence = pickStrongestEvidence(inferableCandidates)
    return {
      matchQuality: 'inferable',
      evidence,
      matchedBy: evidence.skill,
    }
  }

  return { matchQuality: 'missing' }
}

function pickStrongestEvidence(candidates: ResumeSkillEvidence[]): ResumeSkillEvidence {
  return [...candidates].sort((left, right) => {
    const leftScore =
      EVIDENCE_STRENGTH_WEIGHTS[left.strength] + EXPERIENCE_DEPTH_WEIGHTS[left.depth]
    const rightScore =
      EVIDENCE_STRENGTH_WEIGHTS[right.strength] + EXPERIENCE_DEPTH_WEIGHTS[right.depth]

    return rightScore - leftScore
  })[0]
}

function describeAssessment(
  requirement: JobRequirement,
  matchQuality: MatchQuality,
  evidence?: ResumeSkillEvidence,
  matchedBy?: string,
): string {
  if (matchQuality === 'missing') {
    return `${requirement.skill} is missing`
  }

  if (!evidence || !matchedBy) {
    return `${requirement.skill} is only weakly supported`
  }

  if (matchQuality === 'direct') {
    return `${requirement.skill} is directly evidenced through ${evidence.source.replace('_', ' ')}`
  }

  if (matchQuality === 'transferable') {
    return `${requirement.skill} is supported by related experience in ${matchedBy}`
  }

  return `${requirement.skill} is weakly inferable from ${matchedBy}`
}

function assessRequirement(
  requirement: JobRequirement,
  skillIndex: Map<string, ResumeSkillEvidence[]>,
): RequirementAssessment {
  const { matchQuality, evidence, matchedBy } = findBestEvidence(requirement, skillIndex)

  const evidenceScore = evidence ? EVIDENCE_STRENGTH_WEIGHTS[evidence.strength] : 0
  const depthScore = evidence ? EXPERIENCE_DEPTH_WEIGHTS[evidence.depth] : 0
  const matchScore = MATCH_QUALITY_WEIGHTS[matchQuality]
  const confidence = Number((matchScore * ((evidenceScore + depthScore) / 2)).toFixed(2))

  return {
    requirementId: requirement.id,
    skill: requirement.skill,
    priority: requirement.priority,
    matchQuality,
    matchedBy,
    evidenceStrength: evidence?.strength,
    experienceDepth: evidence?.depth,
    confidence,
    reasoning: describeAssessment(requirement, matchQuality, evidence, matchedBy),
    learnability: requirement.learnability,
    isKnockout: requirement.isKnockout,
  }
}

function assessKnockouts(
  resume: ResumeProfile,
  job: NormalizedJobPosting,
  assessments: RequirementAssessment[],
): ResumeJobFitResult['knockout'] {
  const reasons: string[] = []
  const resumeLanguages = new Set(resume.languages.map(normalize))
  const requiredLanguages = job.requiredLanguages.map(normalize)

  for (const language of requiredLanguages) {
    if (!resumeLanguages.has(language)) {
      reasons.push(`Missing required language: ${language}`)
    }
  }

  const locationConstraint = job.locationConstraint
  if (
    locationConstraint &&
    locationConstraint.mode !== 'remote' &&
    locationConstraint.allowedLocations &&
    locationConstraint.allowedLocations.length > 0
  ) {
    const allowedLocations = new Set(locationConstraint.allowedLocations.map(normalize))
    const matchesLocation = (resume.locations ?? [])
      .map(normalize)
      .some((location) => allowedLocations.has(location))

    if (!matchesLocation) {
      reasons.push(`Location constraint not met for ${locationConstraint.mode} role`)
    }
  }

  const seniorityFit = assessSeniorityFit(resume.seniority, job.seniority)
  if (seniorityFit === 'clearly_below') {
    reasons.push('Seniority is clearly below the expected level')
  }

  const missingCriticalTechnology = assessments.some(
    (assessment) =>
      assessment.isKnockout === true && assessment.matchQuality === 'missing',
  )

  if (missingCriticalTechnology) {
    reasons.push('Missing a critical core technology')
  }

  return {
    blocked: reasons.length > 0,
    reasons,
  }
}

function assessSeniorityFit(
  resumeSeniority: SeniorityLevel,
  jobSeniority: SeniorityLevel,
): SeniorityFit {
  const difference = SENIORITY_ORDER[resumeSeniority] - SENIORITY_ORDER[jobSeniority]

  if (difference >= 1) {
    return 'overqualified'
  }

  if (difference === 0) {
    return 'aligned'
  }

  if (difference === -1) {
    return 'slightly_below'
  }

  return 'clearly_below'
}

function seniorityMultiplier(seniorityFit: SeniorityFit): number {
  switch (seniorityFit) {
    case 'aligned':
      return 1
    case 'overqualified':
      return 0.95
    case 'slightly_below':
      return 0.8
    case 'clearly_below':
      return 0.55
  }
}

function deriveEvidenceQuality(assessments: RequirementAssessment[]): EvidenceQuality {
  const supportedAssessments = assessments.filter(
    (assessment) => assessment.matchQuality !== 'missing',
  )

  if (supportedAssessments.length === 0) {
    return 'weak'
  }

  const averageConfidence =
    supportedAssessments.reduce((sum, assessment) => sum + assessment.confidence, 0) /
    supportedAssessments.length

  if (averageConfidence >= 0.7) {
    return 'strong'
  }

  if (averageConfidence >= 0.4) {
    return 'mixed'
  }

  return 'weak'
}

function deriveOverallMatchLevel(
  score: number,
  blocked: boolean,
): OverallMatchLevel {
  if (blocked) {
    return 'blocked'
  }

  if (score >= 80) {
    return 'strong'
  }

  if (score >= 65) {
    return 'promising'
  }

  if (score >= 45) {
    return 'stretch'
  }

  return 'low'
}

function deriveScoreBand(score: number): ScoreBand {
  if (score < 50) {
    return 'low'
  }

  if (score < 80) {
    return 'medium'
  }

  return 'high'
}

function deriveStrengths(
  assessments: RequirementAssessment[],
): RequirementAssessment[] {
  return assessments
    .filter(
      (assessment) =>
        assessment.priority !== 'nice_to_have' &&
        (assessment.matchQuality === 'direct' || assessment.matchQuality === 'transferable') &&
        assessment.confidence >= 0.55,
    )
    .slice(0, 5)
}

function deriveCriticalGaps(assessments: RequirementAssessment[]): string[] {
  return assessments
    .filter(
      (assessment) =>
        assessment.matchQuality === 'missing' &&
        (assessment.isKnockout === true ||
          assessment.priority === 'core' ||
          assessment.learnability === 'structural'),
    )
    .map((assessment) => assessment.skill)
}

function deriveLearnableGaps(assessments: RequirementAssessment[]): string[] {
  return assessments
    .filter(
      (assessment) =>
        assessment.matchQuality === 'missing' &&
        assessment.learnability !== 'structural' &&
        !(
          assessment.isKnockout === true ||
          assessment.priority === 'core'
        ),
    )
    .map((assessment) => assessment.skill)
}

function deriveResumeImprovementSuggestions(
  assessments: RequirementAssessment[],
): string[] {
  const suggestions = assessments.flatMap((assessment) => {
    if (
      assessment.matchQuality !== 'missing' &&
      assessment.evidenceStrength === 'skills_section'
    ) {
      return [`Show ${assessment.skill} in project or work bullets, not only in a skills list`]
    }

    if (assessment.matchQuality === 'inferable') {
      return [`Make the connection to ${assessment.skill} explicit in the resume`]
    }

    return []
  })

  return unique(suggestions).slice(0, 5)
}

function deriveRecommendedSkillsToLearnNext(
  assessments: RequirementAssessment[],
): string[] {
  return assessments
    .filter(
      (assessment) =>
        assessment.matchQuality === 'missing' &&
        assessment.learnability !== 'structural',
    )
    .sort((left, right) => PRIORITY_WEIGHTS[right.priority] - PRIORITY_WEIGHTS[left.priority])
    .map((assessment) => assessment.skill)
    .slice(0, 5)
}

function buildReasoningSummary(
  result: Pick<
    ResumeJobFitResult,
    | 'overallMatchLevel'
    | 'evidenceQuality'
    | 'seniorityFit'
    | 'criticalGaps'
    | 'learnableGaps'
    | 'strengths'
  >,
): string {
  const strengthsText =
    result.strengths.length > 0
      ? `Key strengths: ${result.strengths
          .slice(0, 2)
          .map((assessment) => assessment.reasoning)
          .join('; ')}.`
      : 'No strong supporting evidence was found yet.'
  const criticalGapsText =
    result.criticalGaps.length > 0
      ? `Critical gaps: ${result.criticalGaps.join(', ')}.`
      : 'No critical gaps detected.'
  const learnableGapsText =
    result.learnableGaps.length > 0
      ? `Learnable gaps: ${result.learnableGaps.join(', ')}.`
      : 'No immediate learnable gaps were identified.'

  return [
    `Overall fit is ${result.overallMatchLevel}.`,
    `Evidence quality is ${result.evidenceQuality} and seniority fit is ${result.seniorityFit}.`,
    strengthsText,
    criticalGapsText,
    learnableGapsText,
  ].join(' ')
}

export function scoreResumeAgainstJob(
  resume: ResumeProfile,
  job: NormalizedJobPosting,
): ResumeJobFitResult {
  const skillIndex = buildSkillIndex(resume)
  const requirementAssessments = job.requirements.map((requirement) =>
    assessRequirement(requirement, skillIndex),
  )

  const totalWeight = job.requirements.reduce(
    (sum, requirement) => sum + PRIORITY_WEIGHTS[requirement.priority],
    0,
  )

  const weightedScore = requirementAssessments.reduce((sum, assessment) => {
    const weight = PRIORITY_WEIGHTS[assessment.priority]
    return sum + weight * assessment.confidence
  }, 0)

  const seniorityFit = assessSeniorityFit(resume.seniority, job.seniority)
  const knockout = assessKnockouts(resume, job, requirementAssessments)
  const rawScore = totalWeight === 0 ? 0 : (weightedScore / totalWeight) * 100
  const adjustedScore = rawScore * seniorityMultiplier(seniorityFit)
  const overallScore = Math.max(
    0,
    Math.min(knockout.blocked ? adjustedScore * 0.35 : adjustedScore, 100),
  )
  const evidenceQuality = deriveEvidenceQuality(requirementAssessments)
  const strengths = deriveStrengths(requirementAssessments)
  const criticalGaps = deriveCriticalGaps(requirementAssessments)
  const learnableGaps = deriveLearnableGaps(requirementAssessments)
  const roundedOverallScore = Number(overallScore.toFixed(1))
  const scoreBand = deriveScoreBand(roundedOverallScore)
  const overallMatchLevel = deriveOverallMatchLevel(roundedOverallScore, knockout.blocked)
  const resumeImprovementSuggestions =
    deriveResumeImprovementSuggestions(requirementAssessments)
  const recommendedSkillsToLearnNext =
    deriveRecommendedSkillsToLearnNext(requirementAssessments)

  const result: ResumeJobFitResult = {
    overallScore: roundedOverallScore,
    scoreBand,
    overallMatchLevel,
    knockout,
    seniorityFit,
    evidenceQuality,
    strengths,
    criticalGaps,
    learnableGaps,
    reasoningSummary: '',
    resumeImprovementSuggestions,
    recommendedSkillsToLearnNext,
    requirementAssessments,
  }

  result.reasoningSummary = buildReasoningSummary(result)

  return result
}
