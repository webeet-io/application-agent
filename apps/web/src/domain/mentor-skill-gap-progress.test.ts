import { describe, expect, it } from 'vitest'
import type { LearningProgressEvent, PrioritizedSkillGap } from './mentor-skill-gap'
import {
  appendLearningProgressEvent,
  deriveLearningProgressSnapshotForGap,
  recomputeResumeReadinessFromProgressLogs,
} from './mentor-skill-gap-progress'

const buildEvent = (overrides: Partial<LearningProgressEvent> = {}): LearningProgressEvent => ({
  eventId: 'event-1',
  userId: 'user-1',
  gapName: 'docker',
  gapKind: 'hard_skill',
  eventType: 'studied_foundation',
  occurredAt: '2026-04-07T00:00:00.000Z',
  evidenceLevel: 'weak',
  artifactType: 'note',
  artifactUrl: null,
  relatedStepOrder: 1,
  details: 'Studied foundations',
  ...overrides,
})

const buildGap = (overrides: Partial<PrioritizedSkillGap> = {}): PrioritizedSkillGap => ({
  name: 'docker',
  kind: 'hard_skill',
  confidence: 0.8,
  frequencyAcrossRelevantJobs: 0.75,
  jobsMatchedCount: 3,
  targetRoleRelevance: 0.7,
  blockingScore: 0.7,
  readinessState: 'unknown',
  rankingScore: 2.45,
  priorityBucket: 'important_next',
  whyNow: ['high_frequency_across_relevant_jobs'],
  contradictionMarker: false,
  evidenceSnapshot: {
    presentOnResume: false,
    presentInProgressLogs: false,
    presentInUserDeclaration: false,
    repeatedInApplicationHistory: false,
    exampleJobTitles: ['Software Engineer Mid'],
  },
  recommendation: {
    status: 'not_ready',
    ruleResults: {
      hasProofBearingArtifact: false,
      hasCompletedRequiredExitCriterion: false,
      hasUsageEvidence: false,
      hasContradictoryEvidence: false,
      minimumEvidenceCountMet: false,
    },
    missingRequirements: [],
    justificationCodes: ['degraded_low_confidence'],
    guidance: '',
  },
  ...overrides,
})

describe('appendLearningProgressEvent', () => {
  it('keeps the log append-only and sorted by occurredAt', () => {
    const events = appendLearningProgressEvent(
      [buildEvent({ eventId: 'event-2', occurredAt: '2026-04-08T00:00:00.000Z' })],
      buildEvent({ eventId: 'event-1', occurredAt: '2026-04-07T00:00:00.000Z' }),
    )

    expect(events.map((event) => event.eventId)).toEqual(['event-1', 'event-2'])
  })
})

describe('deriveLearningProgressSnapshotForGap', () => {
  it('derives stage, evidence counts, and completed steps from log events', () => {
    const snapshot = deriveLearningProgressSnapshotForGap('docker', 'hard_skill', [
      buildEvent(),
      buildEvent({
        eventId: 'event-2',
        eventType: 'built_project',
        occurredAt: '2026-04-08T00:00:00.000Z',
        evidenceLevel: 'moderate',
        artifactType: 'project',
        artifactUrl: 'https://example.com/project',
        relatedStepOrder: 2,
      }),
      buildEvent({
        eventId: 'event-3',
        eventType: 'completed_exit_criterion',
        occurredAt: '2026-04-09T00:00:00.000Z',
        evidenceLevel: 'moderate',
        relatedStepOrder: 2,
      }),
    ])

    expect(snapshot).toMatchObject({
      gapName: 'docker',
      gapKind: 'hard_skill',
      totalEvents: 3,
      currentStage: 'practice',
      hasProofBearingArtifact: true,
      hasExitCriterionCompletion: true,
      moderateOrStrongEvidenceCount: 2,
      completedStepOrders: [2],
    })
  })

  it('derives proof stage when real-context usage exists', () => {
    const snapshot = deriveLearningProgressSnapshotForGap('docker', 'hard_skill', [
      buildEvent({
        eventId: 'event-2',
        eventType: 'used_in_real_context',
        evidenceLevel: 'strong',
        artifactType: 'work_sample',
        artifactUrl: 'https://example.com/work',
      }),
    ])

    expect(snapshot.currentStage).toBe('proof')
    expect(snapshot.hasUsageEvidence).toBe(true)
  })
})

describe('recomputeResumeReadinessFromProgressLogs', () => {
  it('recomputes readiness directly from the append-only log', () => {
    const recommendation = recomputeResumeReadinessFromProgressLogs(buildGap(), [
      buildEvent({
        eventId: 'event-1',
        eventType: 'built_project',
        evidenceLevel: 'moderate',
        artifactType: 'project',
        artifactUrl: 'https://example.com/project',
      }),
      buildEvent({
        eventId: 'event-2',
        eventType: 'used_in_real_context',
        evidenceLevel: 'strong',
        artifactType: 'work_sample',
        artifactUrl: 'https://example.com/work',
      }),
      buildEvent({
        eventId: 'event-3',
        eventType: 'completed_exit_criterion',
        evidenceLevel: 'moderate',
        artifactType: 'note',
      }),
    ])

    expect(recommendation.status).toBe('ready_now')
  })
})
