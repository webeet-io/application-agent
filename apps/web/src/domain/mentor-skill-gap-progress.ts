import type {
  LearningProgressEvent,
  LearningProgressSnapshot,
  PrioritizedSkillGap,
  ResumeReadinessRecommendation,
} from './mentor-skill-gap'
import { evaluateResumeReadinessForGap } from './mentor-skill-gap-readiness'

const normalize = (value: string): string => value.trim().toLowerCase()

const compareByOccurredAt = (left: LearningProgressEvent, right: LearningProgressEvent): number =>
  new Date(left.occurredAt).getTime() - new Date(right.occurredAt).getTime()

const isMatchingGapEvent = (event: LearningProgressEvent, gapName: string): boolean =>
  normalize(event.gapName) === normalize(gapName)

const isModerateOrStrong = (event: LearningProgressEvent): boolean =>
  event.evidenceLevel === 'moderate' || event.evidenceLevel === 'strong'

const isProofBearing = (event: LearningProgressEvent): boolean =>
  (event.eventType === 'built_project' || event.eventType === 'used_in_real_context') && isModerateOrStrong(event)

const deriveCurrentStage = (events: LearningProgressEvent[]): LearningProgressSnapshot['currentStage'] => {
  if (events.some((event) => event.eventType === 'used_in_real_context')) {
    return 'proof'
  }

  if (events.some((event) => event.eventType === 'built_project')) {
    return 'practice'
  }

  if (events.some((event) => event.eventType === 'studied_foundation' || event.eventType === 'completed_guided_exercise')) {
    return 'foundation'
  }

  return 'not_started'
}

export const appendLearningProgressEvent = (
  existingEvents: LearningProgressEvent[],
  newEvent: LearningProgressEvent,
): LearningProgressEvent[] =>
  [...existingEvents, newEvent].sort(compareByOccurredAt)

export const deriveLearningProgressSnapshotForGap = (
  gapName: string,
  gapKind: PrioritizedSkillGap['kind'],
  progressEvents: LearningProgressEvent[],
): LearningProgressSnapshot => {
  const matchingEvents = progressEvents
    .filter((event) => isMatchingGapEvent(event, gapName))
    .sort(compareByOccurredAt)

  const completedStepOrders = Array.from(
    new Set(
      matchingEvents
        .filter((event) => event.eventType === 'completed_exit_criterion' && event.relatedStepOrder !== null)
        .map((event) => event.relatedStepOrder as number),
    ),
  ).sort((left, right) => left - right)

  const artifactContextCount = new Set(
    matchingEvents
      .filter((event) => event.artifactType !== 'none')
      .map((event) => `${event.artifactType}:${event.artifactUrl ?? event.details}`),
  ).size

  return {
    gapName,
    gapKind,
    totalEvents: matchingEvents.length,
    latestEventAt: matchingEvents.length > 0 ? matchingEvents[matchingEvents.length - 1].occurredAt : null,
    completedStepOrders,
    hasProofBearingArtifact: matchingEvents.some(isProofBearing),
    hasUsageEvidence: matchingEvents.some(
      (event) => event.eventType === 'used_in_real_context' && isModerateOrStrong(event),
    ),
    hasExitCriterionCompletion: matchingEvents.some((event) => event.eventType === 'completed_exit_criterion'),
    moderateOrStrongEvidenceCount: matchingEvents.filter(isModerateOrStrong).length,
    strongEvidenceCount: matchingEvents.filter((event) => event.evidenceLevel === 'strong').length,
    artifactContextCount,
    currentStage: deriveCurrentStage(matchingEvents),
  }
}

export const recomputeResumeReadinessFromProgressLogs = (
  gap: Pick<PrioritizedSkillGap, 'name' | 'kind' | 'contradictionMarker'>,
  progressEvents: LearningProgressEvent[],
): ResumeReadinessRecommendation => evaluateResumeReadinessForGap(gap, progressEvents)
