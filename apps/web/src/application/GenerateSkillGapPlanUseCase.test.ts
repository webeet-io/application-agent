import { describe, expect, it } from 'vitest'
import type { AttemptResult } from '@ceevee/types'
import {
  GenerateSkillGapPlanUseCase,
  type GenerateSkillGapPlanPorts,
} from './GenerateSkillGapPlanUseCase'
import type {
  ApplicationHistorySignalInput,
  LearningProgressEvent,
  MentorSkillGapPreferences,
  OpportunitySignalInput,
  ResumeSignalInput,
  UserDeclaredSkillInput,
} from '@/domain/mentor-skill-gap'

const ok = <T>(value: T): AttemptResult<null, T> => ({ success: true, error: null, value })

const buildPreferences = (): MentorSkillGapPreferences => ({
  strategyMode: 'balanced',
  targetRoleFamilies: ['fullstack_engineer'],
  targetSeniority: 'mid',
})

const buildResume = (): ResumeSignalInput => ({
  resumeId: 'resume-1',
  userId: 'user-1',
  skills: ['TypeScript', 'React', 'Node.js'],
  experienceSignals: ['web applications', 'startup'],
  roleSignals: ['frontend'],
})

const buildOpportunity = (overrides: Partial<OpportunitySignalInput> = {}): OpportunitySignalInput => ({
  jobId: 'job-1',
  title: 'Software Engineer Mid',
  normalizedTitle: {
    rawTitle: 'Software Engineer Mid',
    normalizedFamily: 'fullstack_engineer',
    normalizedSeniority: 'mid',
    familyConfidence: 0.5,
    seniorityConfidence: 1,
  },
  skillsMentioned: ['Docker'],
  signalsMentioned: ['frontend'],
  ...overrides,
})

const buildProgressEvent = (overrides: Partial<LearningProgressEvent> = {}): LearningProgressEvent => ({
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
  details: 'Built a project',
  ...overrides,
})

const buildPorts = (overrides: Partial<GenerateSkillGapPlanPorts> = {}): GenerateSkillGapPlanPorts => ({
  mentorSkillGapPreferencePort: {
    findPreferencesByUser: async () => ok(buildPreferences()),
  },
  resumeSignalPort: {
    findCurrentResumeSignalsByUser: async () => ok(buildResume()),
  },
  jobOpportunitySignalPort: {
    findOpenOpportunitySignalsForUser: async () =>
      ok([
        buildOpportunity(),
        buildOpportunity({ jobId: 'job-2', title: 'Software Engineer Senior', normalizedTitle: { rawTitle: 'Software Engineer Senior', normalizedFamily: 'fullstack_engineer', normalizedSeniority: 'senior', familyConfidence: 0.5, seniorityConfidence: 1 } }),
      ]),
  },
  applicationHistoryPort: {
    findApplicationHistorySignalsByUser: async () =>
      ok<ApplicationHistorySignalInput[]>([
        {
          applicationId: 'app-1',
          jobId: 'job-1',
          jobTitle: 'Software Engineer Mid',
          status: 'rejected',
          outcome: 'rejected',
          rejectedReason: null,
          skillsPresent: ['react'],
          skillsMissing: ['docker'],
        },
        {
          applicationId: 'app-2',
          jobId: 'job-2',
          jobTitle: 'Software Engineer Senior',
          status: 'applied',
          outcome: null,
          rejectedReason: null,
          skillsPresent: ['typescript'],
          skillsMissing: ['docker'],
        },
      ]),
  },
  userDeclaredSkillPort: {
    findDeclaredSkillsByUser: async () => ok<UserDeclaredSkillInput[]>([]),
  },
  learningProgressPort: {
    listEventsForUser: async () =>
      ok<LearningProgressEvent[]>([
        buildProgressEvent(),
        buildProgressEvent({
          eventId: 'event-2',
          eventType: 'used_in_real_context',
          evidenceLevel: 'strong',
          artifactType: 'work_sample',
          artifactUrl: 'https://example.com/work',
        }),
        buildProgressEvent({
          eventId: 'event-3',
          eventType: 'completed_exit_criterion',
          artifactType: 'note',
          artifactUrl: null,
        }),
      ]),
  },
  ...overrides,
})

describe('GenerateSkillGapPlanUseCase', () => {
  it('orchestrates detection, prioritization, paths, and readiness into a final plan', async () => {
    const useCase = new GenerateSkillGapPlanUseCase(buildPorts())

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }

    expect(result.value.strategyMode).toBe('balanced')
    expect(result.value.inputQuality).toMatchObject({
      hasRelevantJobs: true,
      relevantJobCount: 2,
      hasApplicationHistory: true,
      hasUserDeclaredSkills: false,
    })
    expect(result.value.prioritizedGaps[0]).toMatchObject({
      name: 'docker',
      recommendation: {
        status: 'ready_now',
      },
    })
    expect(result.value.learningPaths[0].gapName).toBe('docker')
    expect(result.value.resourceRecommendations).toBeUndefined()
  })

  it('returns a degraded empty plan when no relevant jobs are found', async () => {
    const useCase = new GenerateSkillGapPlanUseCase(
      buildPorts({
        jobOpportunitySignalPort: {
          findOpenOpportunitySignalsForUser: async () =>
            ok([
              buildOpportunity({
                jobId: 'job-x',
                title: 'Solutions Engineer Mid',
                normalizedTitle: {
                  rawTitle: 'Solutions Engineer Mid',
                  normalizedFamily: 'other',
                  normalizedSeniority: 'mid',
                  familyConfidence: 0,
                  seniorityConfidence: 1,
                },
              }),
            ]),
        },
      }),
    )

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }

    expect(result.value.inputQuality.hasRelevantJobs).toBe(false)
    expect(result.value.prioritizedGaps).toEqual([])
    expect(result.value.learningPaths).toEqual([])
    expect(result.value.inputQuality.fallbackSummary).toContain('No relevant jobs were found')
  })

  it('degrades gracefully when optional sources are unavailable', async () => {
    const useCase = new GenerateSkillGapPlanUseCase(
      buildPorts({
        applicationHistoryPort: {
          findApplicationHistorySignalsByUser: async () => ({
            success: false,
            error: { type: 'unavailable', message: 'offline' },
            value: null,
          }),
        },
        userDeclaredSkillPort: {
          findDeclaredSkillsByUser: async () => ({
            success: false,
            error: { type: 'unavailable', message: 'offline' },
            value: null,
          }),
        },
        learningProgressPort: {
          listEventsForUser: async () => ({
            success: false,
            error: { type: 'unavailable', message: 'offline' },
            value: null,
          }),
        },
      }),
    )

    const result = await useCase.execute({ userId: 'user-1', strategyModeOverride: 'get_hired_quickly' })

    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }

    expect(result.value.strategyMode).toBe('get_hired_quickly')
    expect(result.value.inputQuality).toMatchObject({
      hasApplicationHistory: false,
      hasUserDeclaredSkills: false,
      degradedMode: 'no_history',
    })
    expect(result.value.prioritizedGaps[0].recommendation.status).toBe('not_ready')
  })
})
