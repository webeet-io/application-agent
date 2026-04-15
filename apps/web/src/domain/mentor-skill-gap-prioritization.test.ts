import { describe, expect, it } from 'vitest'
import type { DetectedRecurringGap } from './mentor-skill-gap'
import { prioritizeDetectedSkillGaps } from './mentor-skill-gap-prioritization'

const buildGap = (overrides: Partial<DetectedRecurringGap> = {}): DetectedRecurringGap => ({
  name: 'docker',
  kind: 'hard_skill',
  frequencyAcrossRelevantJobs: 0.75,
  jobsMatchedCount: 3,
  targetRoleRelevance: 0.7,
  confidence: 0.8,
  isRecurring: true,
  contradictionMarker: false,
  evidence: {
    jobsMatched: 3,
    exampleJobTitles: ['Software Engineer Mid', 'Software Engineer Senior'],
    missingFromResume: true,
    contradictedByUserInput: false,
    repeatedInApplicationHistory: false,
  },
  ...overrides,
})

describe('prioritizeDetectedSkillGaps', () => {
  it('assigns critical_now to strong recurring blockers', () => {
    const prioritized = prioritizeDetectedSkillGaps(
      [
        buildGap({
          frequencyAcrossRelevantJobs: 1,
          targetRoleRelevance: 0.9,
          evidence: {
            jobsMatched: 3,
            exampleJobTitles: ['Software Engineer Mid'],
            missingFromResume: true,
            contradictedByUserInput: false,
            repeatedInApplicationHistory: true,
          },
        }),
      ],
      'balanced',
    )

    expect(prioritized[0]).toMatchObject({
      name: 'docker',
      priorityBucket: 'critical_now',
      blockingScore: 1,
      readinessState: 'unknown',
    })
    expect(prioritized[0].whyNow).toEqual(
      expect.arrayContaining([
        'high_frequency_across_relevant_jobs',
        'high_target_role_alignment',
        'blocking_current_applications',
        'repeated_missing_in_application_history',
      ]),
    )
  })

  it('biases long_term_growth toward experience and signal gaps', () => {
    const hardSkill = buildGap({ name: 'docker', kind: 'hard_skill' })
    const experienceGap = buildGap({ name: 'system design experience', kind: 'experience' })

    const prioritized = prioritizeDetectedSkillGaps([hardSkill, experienceGap], 'long_term_growth')

    expect(prioritized[0].name).toBe('system design experience')
    expect(prioritized[0].whyNow).toContain('high_long_term_leverage')
  })

  it('downgrades contradictory low-confidence gaps to optional', () => {
    const prioritized = prioritizeDetectedSkillGaps(
      [
        buildGap({
          name: 'aws',
          confidence: 0.3,
          contradictionMarker: true,
          evidence: {
            jobsMatched: 2,
            exampleJobTitles: ['Software Engineer Mid'],
            missingFromResume: true,
            contradictedByUserInput: true,
            repeatedInApplicationHistory: false,
          },
        }),
      ],
      'balanced',
    )

    expect(prioritized[0]).toMatchObject({
      name: 'aws',
      priorityBucket: 'optional',
      contradictionMarker: true,
    })
    expect(prioritized[0].whyNow).toEqual(
      expect.arrayContaining(['contradicted_by_user_input', 'degraded_low_confidence']),
    )
  })

  it('keeps important_next for meaningful but non-critical gaps', () => {
    const prioritized = prioritizeDetectedSkillGaps(
      [
        buildGap({
          name: 'kubernetes',
          frequencyAcrossRelevantJobs: 0.6,
          jobsMatchedCount: 2,
          targetRoleRelevance: 0.7,
          confidence: 0.7,
          evidence: {
            jobsMatched: 2,
            exampleJobTitles: ['Software Engineer Mid'],
            missingFromResume: true,
            contradictedByUserInput: false,
            repeatedInApplicationHistory: false,
          },
        }),
      ],
      'balanced',
    )

    expect(prioritized[0].priorityBucket).toBe('important_next')
  })
})
