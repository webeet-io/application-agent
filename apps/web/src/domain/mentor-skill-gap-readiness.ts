import type {
  LearningProgressEvent,
  PrioritizedSkillGap,
  ResumeReadinessRecommendation,
  SkillGapKind,
  WhyNowReason,
} from './mentor-skill-gap'

const normalize = (value: string): string => value.trim().toLowerCase()

const isMatchingGapEvent = (event: LearningProgressEvent, gapName: string): boolean =>
  normalize(event.gapName) === normalize(gapName)

const isModerateOrStrong = (event: LearningProgressEvent): boolean =>
  event.evidenceLevel === 'moderate' || event.evidenceLevel === 'strong'

const isProofBearingEvent = (event: LearningProgressEvent): boolean =>
  (event.eventType === 'built_project' || event.eventType === 'used_in_real_context') && isModerateOrStrong(event)

const hasCompletedExitCriterion = (events: LearningProgressEvent[]): boolean =>
  events.some((event) => event.eventType === 'completed_exit_criterion')

const hasUsageEvidence = (events: LearningProgressEvent[]): boolean =>
  events.some((event) => event.eventType === 'used_in_real_context' && isModerateOrStrong(event))

const countModerateOrStrongEvents = (events: LearningProgressEvent[]): number =>
  events.filter(isModerateOrStrong).length

const countStrongEvents = (events: LearningProgressEvent[]): number =>
  events.filter((event) => event.evidenceLevel === 'strong').length

const countDistinctArtifactContexts = (events: LearningProgressEvent[]): number =>
  new Set(
    events
      .filter((event) => event.artifactType !== 'none')
      .map((event) => `${event.artifactType}:${event.artifactUrl ?? event.details}`),
  ).size

const buildMissingRequirements = (
  ruleResults: ResumeReadinessRecommendation['ruleResults'],
  minimumEvidenceRequired: number,
  strongEvidenceRequired: number,
): string[] => {
  const missing: string[] = []

  if (!ruleResults.hasProofBearingArtifact) {
    missing.push('proof_bearing_artifact_required')
  }

  if (!ruleResults.hasCompletedRequiredExitCriterion) {
    missing.push('exit_criterion_completion_required')
  }

  if (!ruleResults.hasUsageEvidence) {
    missing.push('real_usage_evidence_required')
  }

  if (!ruleResults.minimumEvidenceCountMet) {
    if (strongEvidenceRequired > 0) {
      missing.push(`minimum_${strongEvidenceRequired}_strong_evidence_events_required`)
    } else {
      missing.push(`minimum_${minimumEvidenceRequired}_moderate_or_strong_events_required`)
    }
  }

  if (ruleResults.hasContradictoryEvidence) {
    missing.push('contradiction_must_be_resolved')
  }

  return missing
}

const buildJustificationCodes = (
  status: ResumeReadinessRecommendation['status'],
  ruleResults: ResumeReadinessRecommendation['ruleResults'],
): WhyNowReason[] => {
  const codes: WhyNowReason[] = []

  if (ruleResults.hasProofBearingArtifact) {
    codes.push('close_to_resume_ready')
  }

  if (ruleResults.hasContradictoryEvidence) {
    codes.push('contradicted_by_user_input')
  }

  if (status === 'not_ready') {
    codes.push('degraded_low_confidence')
  }

  return Array.from(new Set(codes))
}

const evaluateHardSkillReadiness = (
  events: LearningProgressEvent[],
  contradictionMarker: boolean,
): ResumeReadinessRecommendation['ruleResults'] => ({
  hasProofBearingArtifact: events.some(isProofBearingEvent),
  hasCompletedRequiredExitCriterion: hasCompletedExitCriterion(events),
  hasUsageEvidence: hasUsageEvidence(events),
  hasContradictoryEvidence: contradictionMarker,
  minimumEvidenceCountMet: countModerateOrStrongEvents(events) >= 2,
})

const evaluateExperienceReadiness = (
  events: LearningProgressEvent[],
  contradictionMarker: boolean,
): ResumeReadinessRecommendation['ruleResults'] => ({
  hasProofBearingArtifact: events.filter(isProofBearingEvent).length >= 2,
  hasCompletedRequiredExitCriterion: hasCompletedExitCriterion(events),
  hasUsageEvidence: events.some(isProofBearingEvent),
  hasContradictoryEvidence: contradictionMarker,
  minimumEvidenceCountMet:
    countModerateOrStrongEvents(events) >= 3 && countDistinctArtifactContexts(events) >= 1,
})

const evaluateSignalReadiness = (
  events: LearningProgressEvent[],
  contradictionMarker: boolean,
): ResumeReadinessRecommendation['ruleResults'] => ({
  hasProofBearingArtifact: countDistinctArtifactContexts(events) >= 2,
  hasCompletedRequiredExitCriterion: hasCompletedExitCriterion(events),
  hasUsageEvidence: countDistinctArtifactContexts(events) >= 2,
  hasContradictoryEvidence: contradictionMarker,
  minimumEvidenceCountMet: countStrongEvents(events) >= 2,
})

const resolveStatus = (
  ruleResults: ResumeReadinessRecommendation['ruleResults'],
): ResumeReadinessRecommendation['status'] => {
  const failedRules = [
    !ruleResults.hasProofBearingArtifact,
    !ruleResults.hasCompletedRequiredExitCriterion,
    !ruleResults.hasUsageEvidence,
    ruleResults.hasContradictoryEvidence,
    !ruleResults.minimumEvidenceCountMet,
  ].filter(Boolean).length

  if (failedRules === 0) {
    return 'ready_now'
  }

  if (failedRules === 1) {
    return 'almost_ready'
  }

  return 'not_ready'
}

export const evaluateResumeReadinessForGap = (
  gap: Pick<PrioritizedSkillGap, 'name' | 'kind' | 'contradictionMarker'>,
  progressEvents: LearningProgressEvent[],
): ResumeReadinessRecommendation => {
  const matchingEvents = progressEvents.filter((event) => isMatchingGapEvent(event, gap.name))

  const qualifyingMinimumEventExists = matchingEvents.some(isProofBearingEvent)
  if (!qualifyingMinimumEventExists) {
    return {
      status: 'not_ready',
      ruleResults: {
        hasProofBearingArtifact: false,
        hasCompletedRequiredExitCriterion: false,
        hasUsageEvidence: false,
        hasContradictoryEvidence: gap.contradictionMarker,
        minimumEvidenceCountMet: false,
      },
      missingRequirements: [
        'minimum_1_proof_bearing_progress_event_required',
        'progress_log_event_required',
      ],
      justificationCodes: gap.contradictionMarker
        ? ['contradicted_by_user_input', 'degraded_low_confidence']
        : ['degraded_low_confidence'],
      guidance: '',
    }
  }

  const ruleResults =
    gap.kind === 'hard_skill'
      ? evaluateHardSkillReadiness(matchingEvents, gap.contradictionMarker)
      : gap.kind === 'experience'
        ? evaluateExperienceReadiness(matchingEvents, gap.contradictionMarker)
        : evaluateSignalReadiness(matchingEvents, gap.contradictionMarker)

  const status = resolveStatus(ruleResults)
  const missingRequirements = buildMissingRequirements(
    ruleResults,
    gap.kind === 'experience' ? 3 : 2,
    gap.kind === 'signal' ? 2 : 0,
  )

  return {
    status,
    ruleResults,
    missingRequirements,
    justificationCodes: buildJustificationCodes(status, ruleResults),
    guidance: '',
  }
}

export const getResumeReadinessMinimumBar = (
  kind: SkillGapKind,
): { requiredEventTypes: Array<LearningProgressEvent['eventType']>; requiredEvidenceLevels: LearningProgressEvent['evidenceLevel'][] } => ({
  requiredEventTypes: ['built_project', 'used_in_real_context'],
  requiredEvidenceLevels: ['moderate', 'strong'],
})
