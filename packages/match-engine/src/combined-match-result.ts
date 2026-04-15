import type {
  AiResumeMatchResult,
  CombinedResumeMatchOutput,
  CombinedResumeMatchResult,
  DefaultResumeMatchOutput,
  DivergenceLevel,
  MatchComparisonResult,
  MatchDisplayTone,
  MatchOutputItem,
  MatchWeaknessItem,
  RecommendedSkillItem,
  ResumeJobFitResult,
  ScoreBand,
} from '@ceevee/types'

function uniqueByLabelAndDescription<T extends { label: string; description: string }>(
  items: T[],
): T[] {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = `${item.label}::${item.description}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function uniqueStrings(items: string[]): string[] {
  return Array.from(new Set(items))
}

function uniqueRecommendedSkills(
  items: RecommendedSkillItem[],
): RecommendedSkillItem[] {
  const seen = new Set<string>()

  return items.filter((item) => {
    if (seen.has(item.skill)) {
      return false
    }
    seen.add(item.skill)
    return true
  })
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

function displayToneFromBand(scoreBand: ScoreBand): MatchDisplayTone {
  switch (scoreBand) {
    case 'low':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'high':
      return 'success'
  }
}

function divergenceLevelFromDifference(scoreDifference: number): DivergenceLevel {
  if (scoreDifference >= 20) {
    return 'high'
  }

  if (scoreDifference >= 10) {
    return 'moderate'
  }

  return 'low'
}

function compareFallbackAndAi(
  fallbackResult: ResumeJobFitResult,
  aiResult: AiResumeMatchResult,
): MatchComparisonResult {
  const scoreDifference = Math.abs(fallbackResult.overallScore - aiResult.overallScore)
  const divergenceLevel = divergenceLevelFromDifference(scoreDifference)
  const reviewFlag =
    divergenceLevel === 'high' ||
    (fallbackResult.knockout.blocked && aiResult.overallScore >= 65)

  return {
    fallbackScore: fallbackResult.overallScore,
    aiScore: aiResult.overallScore,
    scoreDifference: Number(scoreDifference.toFixed(1)),
    divergenceLevel,
    reviewFlag,
  }
}

function combineScore(
  fallbackResult: ResumeJobFitResult,
  aiResult: AiResumeMatchResult,
  comparison: MatchComparisonResult,
): number {
  if (fallbackResult.knockout.blocked) {
    return fallbackResult.overallScore
  }

  if (comparison.divergenceLevel === 'high') {
    return fallbackResult.overallScore
  }

  // The fallback score stays dominant because it is deterministic and easier to audit.
  const fallbackWeight = 0.7
  const aiWeight = 0.3
  return Number(
    (fallbackResult.overallScore * fallbackWeight + aiResult.overallScore * aiWeight).toFixed(1),
  )
}

function titleFromBand(scoreBand: ScoreBand): string {
  switch (scoreBand) {
    case 'high':
      return 'Strong combined match'
    case 'medium':
      return 'Promising combined match'
    case 'low':
      return 'Low combined match'
  }
}

function mergeStrengths(
  fallbackOutput: DefaultResumeMatchOutput,
  aiResult: AiResumeMatchResult,
): MatchOutputItem[] {
  return uniqueByLabelAndDescription([
    ...fallbackOutput.strengths,
    ...aiResult.strengths,
  ]).slice(0, 6)
}

function mergeWeaknesses(
  fallbackOutput: DefaultResumeMatchOutput,
  aiResult: AiResumeMatchResult,
): MatchWeaknessItem[] {
  return uniqueByLabelAndDescription([
    ...fallbackOutput.weaknesses,
    ...aiResult.weaknesses,
  ]).slice(0, 6)
}

function mergeRecommendedSkills(
  fallbackOutput: DefaultResumeMatchOutput,
  aiResult: AiResumeMatchResult,
): RecommendedSkillItem[] {
  return uniqueRecommendedSkills([
    ...fallbackOutput.recommendedSkillsToLearn,
    ...aiResult.recommendedSkillsToLearn,
  ]).slice(0, 6)
}

function buildCombinedSummary(
  fallbackOutput: DefaultResumeMatchOutput,
  aiResult: AiResumeMatchResult,
  comparison: MatchComparisonResult,
  finalScore: number,
): string {
  const divergenceText = comparison.reviewFlag
    ? 'The rule-based score and AI estimate differ noticeably, so the fallback score remains the safer anchor.'
    : 'The rule-based score and AI estimate are reasonably aligned.'

  return `${titleFromBand(deriveScoreBand(finalScore))} with a ${finalScore}% score. ${fallbackOutput.shortSummary} ${aiResult.shortSummary} ${divergenceText}`
}

export function buildCombinedResumeMatchResult(
  fallbackResult: ResumeJobFitResult,
  fallbackOutput: DefaultResumeMatchOutput,
  aiResult: AiResumeMatchResult,
): CombinedResumeMatchResult {
  const comparison = compareFallbackAndAi(fallbackResult, aiResult)
  const overallScore = combineScore(fallbackResult, aiResult, comparison)
  const scoreBand = deriveScoreBand(overallScore)

  const combinedOutput: CombinedResumeMatchOutput = {
    overallScore,
    scoreBand,
    displayTone: displayToneFromBand(scoreBand),
    title: titleFromBand(scoreBand),
    shortSummary: buildCombinedSummary(
      fallbackOutput,
      aiResult,
      comparison,
      overallScore,
    ),
    strengths: mergeStrengths(fallbackOutput, aiResult),
    weaknesses: mergeWeaknesses(fallbackOutput, aiResult),
    recommendedImprovements: uniqueStrings([
      ...fallbackOutput.recommendedImprovements,
      ...aiResult.recommendedImprovements,
    ]).slice(0, 6),
    recommendedSkillsToLearn: mergeRecommendedSkills(fallbackOutput, aiResult),
  }

  return {
    fallbackResult,
    fallbackOutput,
    aiResult,
    comparison,
    combinedOutput,
  }
}
