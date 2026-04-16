import { describe, expect, it } from 'vitest'
import type { PrioritizedSkillGap } from './mentor-skill-gap'
import { generateLearningPathForGap, generateLearningPaths } from './mentor-learning-path-generation'

const buildPrioritizedGap = (overrides: Partial<PrioritizedSkillGap> = {}): PrioritizedSkillGap => ({
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
  whyNow: ['high_frequency_across_relevant_jobs', 'high_target_role_alignment'],
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

describe('generateLearningPathForGap', () => {
  it('builds a three-step path with ordered buckets and exit criteria', () => {
    const path = generateLearningPathForGap(buildPrioritizedGap(), 'balanced')

    expect(path.steps).toHaveLength(3)
    expect(path.steps.map((step) => step.stepType)).toEqual(['foundation', 'practice', 'proof'])
    expect(path.steps.map((step) => step.bucket)).toEqual(['now', 'next', 'later'])
    expect(path.steps[0].exitCriteria.length).toBeGreaterThan(0)
    expect(path.steps[2].whyThisStep).toContain('close_to_resume_ready')
  })

  it('uses faster bucket sequencing for get_hired_quickly', () => {
    const path = generateLearningPathForGap(buildPrioritizedGap(), 'get_hired_quickly')

    expect(path.steps.map((step) => step.bucket)).toEqual(['now', 'now', 'next'])
  })

  it('assigns longer effort ranges to experience gaps', () => {
    const path = generateLearningPathForGap(
      buildPrioritizedGap({
        name: 'system design experience',
        kind: 'experience',
        priorityBucket: 'strategic_later',
      }),
      'long_term_growth',
    )

    expect(path.totalEstimatedEffort).toMatchObject({
      band: 'long',
      minWeeks: 6,
      maxWeeks: 12,
    })
  })
})

describe('generateLearningPaths', () => {
  it('orders foundational dependencies ahead of higher-ranked dependent gaps', () => {
    const dockerGap = buildPrioritizedGap({
      name: 'docker',
      rankingScore: 2.4,
      priorityBucket: 'important_next',
    })
    const kubernetesGap = buildPrioritizedGap({
      name: 'kubernetes',
      rankingScore: 3.5,
      priorityBucket: 'critical_now',
    })

    const paths = generateLearningPaths([kubernetesGap, dockerGap], 'balanced')

    expect(paths.map((path) => path.gapName)).toEqual(['docker', 'kubernetes'])
  })

  it('skips optional gaps entirely', () => {
    const paths = generateLearningPaths(
      [
        buildPrioritizedGap({ name: 'docker', priorityBucket: 'optional' }),
        buildPrioritizedGap({ name: 'aws', priorityBucket: 'important_next' }),
      ],
      'balanced',
    )

    expect(paths.map((path) => path.gapName)).toEqual(['aws'])
  })
})
