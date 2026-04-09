import type {
  AiResumeMatchResult,
  MatchWeaknessItem,
  RecommendedSkillItem,
} from '@ceevee/types'
import type {
  AiMatchEvaluationError,
  AiMatchEvaluationInput,
  IAiMatchEvaluationPort,
} from '@/ports/outbound/IAiMatchEvaluationPort'
import type { AttemptResult } from '@ceevee/types'

const PLACEHOLDER_CONFIDENCE = 0.45

function clampScore(score: number): number {
  return Math.max(0, Math.min(Number(score.toFixed(1)), 100))
}

function inferAiScore(input: AiMatchEvaluationInput): number {
  if (input.fallbackResult.knockout.blocked) {
    return input.fallbackResult.overallScore
  }

  // Placeholder behavior: lightly adjust the fallback score to simulate
  // a second opinion without overriding deterministic guardrails.
  const bonus =
    input.fallbackResult.learnableGaps.length > 0 &&
    input.fallbackResult.criticalGaps.length === 0
      ? 4
      : 2

  return clampScore(input.fallbackResult.overallScore + bonus)
}

function inferMatchLevel(score: number): AiResumeMatchResult['overallMatchLevel'] {
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

function buildAiWeaknesses(input: AiMatchEvaluationInput): MatchWeaknessItem[] {
  return input.fallbackOutput.weaknesses.length > 0
    ? input.fallbackOutput.weaknesses
    : input.fallbackResult.criticalGaps.map((gap) => ({
        label: gap,
        description: `${gap} remains a meaningful risk for the role.`,
        severity: 'critical',
        type: 'critical_gap',
      }))
}

function buildAiRecommendedSkills(
  input: AiMatchEvaluationInput,
): RecommendedSkillItem[] {
  return input.fallbackOutput.recommendedSkillsToLearn
}

function buildAiSummary(input: AiMatchEvaluationInput, aiScore: number): string {
  const role = input.job.title
  const candidate = input.careerProfile.label ?? 'candidate'
  const strengths =
    input.fallbackOutput.strengths.length > 0
      ? input.fallbackOutput.strengths
          .slice(0, 2)
          .map((item) => item.label)
          .join(', ')
      : 'limited direct evidence'
  const weaknesses =
    input.fallbackOutput.weaknesses.length > 0
      ? input.fallbackOutput.weaknesses
          .slice(0, 2)
          .map((item) => item.label)
          .join(', ')
      : 'no major risks'

  return `${candidate} shows a plausible fit for ${role} with an AI placeholder score of ${aiScore}%. Strong signals include ${strengths}. Main watchouts are ${weaknesses}.`
}

export class PlaceholderAiMatchEvaluationAdapter
  implements IAiMatchEvaluationPort
{
  async evaluate(
    input: AiMatchEvaluationInput,
  ): Promise<AttemptResult<AiMatchEvaluationError, AiResumeMatchResult>> {
    const overallScore = inferAiScore(input)

    return {
      success: true,
      error: null,
      value: {
        overallScore,
        overallMatchLevel: inferMatchLevel(overallScore),
        confidence: PLACEHOLDER_CONFIDENCE,
        strengths: input.fallbackOutput.strengths,
        weaknesses: buildAiWeaknesses(input),
        shortSummary: buildAiSummary(input, overallScore),
        recommendedImprovements: input.fallbackOutput.recommendedImprovements,
        recommendedSkillsToLearn: buildAiRecommendedSkills(input),
      },
    }
  }
}
