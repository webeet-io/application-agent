import { describe, expect, it } from 'vitest'
import type { LearningProgressEvent, PrioritizedSkillGap } from './mentor-skill-gap'
import { evaluateResumeReadinessForGap, getResumeReadinessMinimumBar } from './mentor-skill-gap-readiness'

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

const buildEvent = (overrides: Partial<LearningProgressEvent> = {}): LearningProgressEvent => ({
  eventId: 'event-1',
  userId: 'user-1',
  gapName: 'docker',
  gapKind: 'hard_skill',
  eventType: 'built_project',
  occurredAt: '2026-04-07T00:00:00.000Z',
  evidenceLevel: 'moderate',
  artifactType: 'project',
  artifactUrl: 'https://example.com/project',
  relatedStepOrder: 2,
  details: 'Built a sample project',
  ...overrides,
})

describe('getResumeReadinessMinimumBar', () => {
  it('uses the confirmed minimum qualifying progress event for every kind', () => {
    expect(getResumeReadinessMinimumBar('hard_skill')).toEqual({
      requiredEventTypes: ['built_project', 'used_in_real_context'],
      requiredEvidenceLevels: ['moderate', 'strong'],
    })
    expect(getResumeReadinessMinimumBar('experience')).toEqual({
      requiredEventTypes: ['built_project', 'used_in_real_context'],
      requiredEvidenceLevels: ['moderate', 'strong'],
    })
  })
})

describe('evaluateResumeReadinessForGap', () => {
  it('returns not_ready by default when no progress log meets the minimum bar', () => {
    const recommendation = evaluateResumeReadinessForGap(buildGap(), [])

    expect(recommendation).toMatchObject({
      status: 'not_ready',
      ruleResults: {
        hasProofBearingArtifact: false,
        hasCompletedRequiredExitCriterion: false,
        hasUsageEvidence: false,
        minimumEvidenceCountMet: false,
      },
    })
    expect(recommendation.missingRequirements).toContain('minimum_1_proof_bearing_progress_event_required')
  })

  it('marks a hard skill ready_now only when all deterministic gates pass', () => {
    const recommendation = evaluateResumeReadinessForGap(buildGap(), [
      buildEvent(),
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
        artifactUrl: null,
      }),
    ])

    expect(recommendation).toMatchObject({
      status: 'ready_now',
      ruleResults: {
        hasProofBearingArtifact: true,
        hasCompletedRequiredExitCriterion: true,
        hasUsageEvidence: true,
        hasContradictoryEvidence: false,
        minimumEvidenceCountMet: true,
      },
    })
  })

  it('marks experience almost_ready when exactly one gate is missing', () => {
    const recommendation = evaluateResumeReadinessForGap(
      buildGap({
        name: 'system design experience',
        kind: 'experience',
      }),
      [
        buildEvent({
          gapName: 'system design experience',
          gapKind: 'experience',
          eventId: 'event-1',
          eventType: 'built_project',
          artifactUrl: 'https://example.com/one',
        }),
        buildEvent({
          gapName: 'system design experience',
          gapKind: 'experience',
          eventId: 'event-2',
          eventType: 'used_in_real_context',
          artifactType: 'work_sample',
          artifactUrl: 'https://example.com/two',
        }),
        buildEvent({
          gapName: 'system design experience',
          gapKind: 'experience',
          eventId: 'event-3',
          eventType: 'completed_exit_criterion',
          evidenceLevel: 'weak',
          artifactType: 'note',
          artifactUrl: null,
        }),
      ],
    )

    expect(recommendation.status).toBe('almost_ready')
    expect(recommendation.missingRequirements).toContain('minimum_3_moderate_or_strong_events_required')
  })

  it('requires two strong multi-context artifacts for signals', () => {
    const recommendation = evaluateResumeReadinessForGap(
      buildGap({
        name: 'ownership',
        kind: 'signal',
      }),
      [
        buildEvent({
          gapName: 'ownership',
          gapKind: 'signal',
          eventId: 'event-1',
          eventType: 'used_in_real_context',
          evidenceLevel: 'strong',
          artifactType: 'portfolio',
          artifactUrl: 'https://example.com/portfolio',
        }),
        buildEvent({
          gapName: 'ownership',
          gapKind: 'signal',
          eventId: 'event-2',
          eventType: 'built_project',
          evidenceLevel: 'strong',
          artifactType: 'repo',
          artifactUrl: 'https://example.com/repo',
        }),
        buildEvent({
          gapName: 'ownership',
          gapKind: 'signal',
          eventId: 'event-3',
          eventType: 'completed_exit_criterion',
          evidenceLevel: 'moderate',
          artifactType: 'note',
          artifactUrl: null,
        }),
      ],
    )

    expect(recommendation.status).toBe('ready_now')
  })

  it('keeps contradiction in the rule result even when proof exists', () => {
    const recommendation = evaluateResumeReadinessForGap(
      buildGap({
        contradictionMarker: true,
      }),
      [
        buildEvent(),
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
          artifactUrl: null,
        }),
      ],
    )

    expect(recommendation.status).toBe('almost_ready')
    expect(recommendation.ruleResults.hasContradictoryEvidence).toBe(true)
    expect(recommendation.justificationCodes).toContain('contradicted_by_user_input')
  })
})
