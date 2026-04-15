import type {
  DefaultResumeMatchOutput,
  MatchDisplayTone,
  MatchGapSeverity,
  MatchGapType,
  RecommendedSkillItem,
  RequirementAssessment,
  ResumeJobFitResult,
  ScoreBand,
  SkillLearningPriority,
} from '@ceevee/types'

function toneFromScoreBand(scoreBand: ScoreBand): MatchDisplayTone {
  switch (scoreBand) {
    case 'low':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'high':
      return 'success'
  }
}

function titleFromResult(result: ResumeJobFitResult): string {
  if (result.overallMatchLevel === 'blocked') {
    return 'Blocked match'
  }

  if (result.scoreBand === 'high') {
    return 'Strong match'
  }

  if (result.scoreBand === 'medium') {
    return 'Promising match'
  }

  return 'Low match'
}

function weaknessTypeFromAssessment(assessment: RequirementAssessment): MatchGapType {
  if (assessment.evidenceStrength === 'skills_section') {
    return 'presentation_gap'
  }

  if (
    assessment.isKnockout === true ||
    assessment.priority === 'core' ||
    assessment.learnability === 'structural'
  ) {
    return 'critical_gap'
  }

  return 'learnable_gap'
}

function weaknessSeverityFromAssessment(
  assessment: RequirementAssessment,
): MatchGapSeverity {
  if (
    assessment.isKnockout === true ||
    assessment.priority === 'core' ||
    assessment.learnability === 'structural'
  ) {
    return 'critical'
  }

  if (assessment.priority === 'supporting') {
    return 'moderate'
  }

  return 'low'
}

function learningPriorityFromAssessment(
  assessment: RequirementAssessment,
): SkillLearningPriority {
  if (assessment.priority === 'core') {
    return 'high'
  }

  if (assessment.priority === 'supporting') {
    return 'medium'
  }

  return 'low'
}

function buildSkillLearningReason(assessment: RequirementAssessment): string {
  if (assessment.priority === 'core') {
    return `${assessment.skill} is a core requirement for this role.`
  }

  if (assessment.priority === 'supporting') {
    return `${assessment.skill} would strengthen the candidate's fit for this role.`
  }

  return `${assessment.skill} is a nice-to-have that could improve the application.`
}

function buildShortSummary(result: ResumeJobFitResult): string {
  const strengthsText =
    result.strengths.length > 0
      ? `Key strengths include ${result.strengths
          .slice(0, 2)
          .map((assessment) => assessment.reasoning)
          .join('; ')}.`
      : 'The current resume does not show strong role-specific evidence yet.'
  const gapsText =
    result.criticalGaps.length > 0
      ? `Critical gaps are ${result.criticalGaps.join(', ')}.`
      : result.learnableGaps.length > 0
        ? `Learnable gaps are ${result.learnableGaps.join(', ')}.`
        : 'No major gaps were identified.'

  return `${titleFromResult(result)} with a ${result.overallScore}% score. ${strengthsText} ${gapsText}`
}

function buildWeaknessDescription(assessment: RequirementAssessment): string {
  if (assessment.evidenceStrength === 'skills_section') {
    return `${assessment.skill} is present, but only weakly evidenced in the resume.`
  }

  if (assessment.matchQuality === 'missing') {
    return `${assessment.skill} is currently missing from the resume evidence.`
  }

  return assessment.reasoning
}

export function buildDefaultMatchOutput(
  result: ResumeJobFitResult,
): DefaultResumeMatchOutput {
  const missingAssessments = result.requirementAssessments.filter(
    (assessment) => assessment.matchQuality === 'missing',
  )
  const presentationGapAssessments = result.requirementAssessments.filter(
    (assessment) =>
      assessment.matchQuality !== 'missing' &&
      assessment.evidenceStrength === 'skills_section',
  )
  const learnableAssessments = missingAssessments.filter(
    (assessment) => assessment.learnability !== 'structural',
  )

  return {
    overallScore: result.overallScore,
    scoreBand: result.scoreBand,
    displayTone: toneFromScoreBand(result.scoreBand),
    title: titleFromResult(result),
    shortSummary: buildShortSummary(result),
    strengths: result.strengths.map((assessment) => ({
      label: assessment.skill,
      description: assessment.reasoning,
      priority: assessment.priority,
    })),
    weaknesses: [...missingAssessments, ...presentationGapAssessments].map(
      (assessment) => ({
        label: assessment.skill,
        description: buildWeaknessDescription(assessment),
        priority: assessment.priority,
        severity: weaknessSeverityFromAssessment(assessment),
        type: weaknessTypeFromAssessment(assessment),
      }),
    ),
    recommendedImprovements: result.resumeImprovementSuggestions,
    recommendedSkillsToLearn: learnableAssessments.map<RecommendedSkillItem>(
      (assessment) => ({
        skill: assessment.skill,
        reason: buildSkillLearningReason(assessment),
        priority: learningPriorityFromAssessment(assessment),
      }),
    ),
  }
}
