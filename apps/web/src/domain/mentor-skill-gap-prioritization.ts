import type {
  DetectedRecurringGap,
  PrioritizedSkillGap,
  ResumeReadinessRecommendation,
  SkillGapStrategyMode,
  SkillReadinessState,
  WhyNowReason,
} from './mentor-skill-gap'

// NOTE: readiness state is not available at prioritization time.
// DetectedRecurringGap carries no progress data — that is enriched later by
// enrichPrioritizedGapsWithProgress in the use case, but too late to affect ranking.
// As a result, computeReadinessScore always returns 0.3 and the get_hired_quickly
// bonus in computeStrategyModifier never fires during initial ranking.
// Known limitation — follow-up: thread readiness into DetectedRecurringGap before prioritization.
const deriveReadinessState = (): SkillReadinessState => 'unknown'

const buildDefaultReadinessRecommendation = (gap: DetectedRecurringGap): ResumeReadinessRecommendation => ({
  status: 'not_ready',
  ruleResults: {
    hasProofBearingArtifact: false,
    hasCompletedRequiredExitCriterion: false,
    hasUsageEvidence: false,
    hasContradictoryEvidence: gap.contradictionMarker,
    minimumEvidenceCountMet: false,
  },
  missingRequirements: [
    'progress_log_event_required',
    'proof_bearing_artifact_required',
    'exit_criterion_completion_required',
  ],
  justificationCodes: gap.contradictionMarker ? ['contradicted_by_user_input'] : ['degraded_low_confidence'],
  guidance: '',
})

const computeBlockingScore = (gap: DetectedRecurringGap): number => {
  if (gap.evidence.repeatedInApplicationHistory) {
    return 1
  }

  if (gap.frequencyAcrossRelevantJobs >= 0.5) {
    return 0.7
  }

  if (gap.frequencyAcrossRelevantJobs >= 0.25) {
    return 0.4
  }

  return 0.1
}

const computeReadinessScore = (readinessState: SkillReadinessState): number => {
  if (readinessState === 'learning') return 1
  if (readinessState === 'demonstrated') return 0.7
  if (readinessState === 'resume_ready') return 0
  return 0.3
}

const computeStrategyModifier = (gap: DetectedRecurringGap, strategyMode: SkillGapStrategyMode): number => {
  const readinessState = deriveReadinessState()

  if (strategyMode === 'get_hired_quickly') {
    return readinessState === 'learning' || readinessState === 'demonstrated' ? 0.2 : 0
  }

  if (strategyMode === 'long_term_growth') {
    return gap.kind === 'experience' || gap.kind === 'signal' ? 0.2 : 0
  }

  if (gap.frequencyAcrossRelevantJobs >= 0.5 && gap.targetRoleRelevance >= 0.6) {
    return 0.1
  }

  return 0
}

const buildWhyNowReasons = (
  gap: DetectedRecurringGap,
  blockingScore: number,
  strategyMode: SkillGapStrategyMode,
  rankingScore: number,
): WhyNowReason[] => {
  const reasons: WhyNowReason[] = []

  if (gap.frequencyAcrossRelevantJobs >= 0.5) {
    reasons.push('high_frequency_across_relevant_jobs')
  }

  if (gap.targetRoleRelevance >= 0.6) {
    reasons.push('high_target_role_alignment')
  }

  if (blockingScore >= 0.7) {
    reasons.push('blocking_current_applications')
  }

  if (gap.evidence.repeatedInApplicationHistory) {
    reasons.push('repeated_missing_in_application_history')
  }

  if (strategyMode === 'long_term_growth' && (gap.kind === 'experience' || gap.kind === 'signal')) {
    reasons.push('high_long_term_leverage')
  }

  if (gap.contradictionMarker) {
    reasons.push('contradicted_by_user_input')
  }

  if (rankingScore < 1.4 || gap.confidence < 0.5) {
    reasons.push('degraded_low_confidence')
  }

  return Array.from(new Set(reasons))
}

const computePriorityBucket = (
  gap: DetectedRecurringGap,
  rankingScore: number,
): PrioritizedSkillGap['priorityBucket'] => {
  if (gap.confidence < 0.5) {
    return 'optional'
  }

  if (rankingScore >= 3.2 && gap.frequencyAcrossRelevantJobs >= 0.5 && gap.targetRoleRelevance >= 0.6) {
    return 'critical_now'
  }

  if (rankingScore >= 2.3) {
    return 'important_next'
  }

  if (rankingScore >= 1.4) {
    return 'strategic_later'
  }

  return 'optional'
}

export const prioritizeDetectedSkillGaps = (
  gaps: DetectedRecurringGap[],
  strategyMode: SkillGapStrategyMode,
): PrioritizedSkillGap[] =>
  gaps
    .map((gap) => {
      const readinessState = deriveReadinessState()
      const blockingScore = computeBlockingScore(gap)
      const readinessScore = computeReadinessScore(readinessState)
      const strategyModifier = computeStrategyModifier(gap, strategyMode)
      const contradictionPenalty = gap.contradictionMarker ? 0.2 : 0
      const rankingScore = Number(
        (
          gap.frequencyAcrossRelevantJobs +
          gap.targetRoleRelevance +
          blockingScore +
          readinessScore +
          strategyModifier -
          contradictionPenalty
        ).toFixed(2),
      )

      return {
        name: gap.name,
        kind: gap.kind,
        confidence: gap.confidence,
        frequencyAcrossRelevantJobs: gap.frequencyAcrossRelevantJobs,
        jobsMatchedCount: gap.jobsMatchedCount,
        targetRoleRelevance: gap.targetRoleRelevance,
        blockingScore,
        readinessState,
        rankingScore,
        priorityBucket: computePriorityBucket(gap, rankingScore),
        whyNow: buildWhyNowReasons(gap, blockingScore, strategyMode, rankingScore),
        contradictionMarker: gap.contradictionMarker,
        evidenceSnapshot: {
          presentOnResume: false,
          presentInProgressLogs: false,
          presentInUserDeclaration: gap.evidence.contradictedByUserInput,
          repeatedInApplicationHistory: gap.evidence.repeatedInApplicationHistory,
          exampleJobTitles: gap.evidence.exampleJobTitles,
        },
        recommendation: buildDefaultReadinessRecommendation(gap),
      } satisfies PrioritizedSkillGap
    })
    .sort((left, right) => right.rankingScore - left.rankingScore)
