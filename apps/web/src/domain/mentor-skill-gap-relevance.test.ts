import { describe, expect, it } from 'vitest'
import type { MentorSkillGapPreferences, OpportunitySignalInput, ResumeSignalInput } from './mentor-skill-gap'
import {
  computeRelevantJobScore,
  isRelevantJob,
  isSparseResumeSignalInput,
  normalizeTitleFamily,
} from './mentor-skill-gap-relevance'

const preferences: MentorSkillGapPreferences = {
  strategyMode: 'balanced',
  targetRoleFamilies: ['fullstack_engineer'],
  targetSeniority: 'mid',
}

const resume: ResumeSignalInput = {
  resumeId: 'resume-1',
  userId: 'user-1',
  skills: ['TypeScript', 'React', 'Node.js'],
  experienceSignals: ['startup', 'web applications'],
  roleSignals: ['frontend', 'backend'],
}

const buildOpportunity = (overrides: Partial<OpportunitySignalInput> = {}): OpportunitySignalInput => ({
  jobId: 'job-1',
  title: 'Software Engineer',
  normalizedTitle: normalizeTitleFamily('Software Engineer'),
  skillsMentioned: ['Docker'],
  signalsMentioned: ['frontend'],
  ...overrides,
})

describe('normalizeTitleFamily', () => {
  it('normalizes confirmed ambiguous MVP title mappings', () => {
    expect(normalizeTitleFamily('Software Engineer')).toMatchObject({
      normalizedFamily: 'fullstack_engineer',
      familyConfidence: 0.5,
    })
    expect(normalizeTitleFamily('Application Engineer')).toMatchObject({
      normalizedFamily: 'backend_engineer',
      familyConfidence: 0.5,
    })
    expect(normalizeTitleFamily('Solutions Engineer')).toMatchObject({
      normalizedFamily: 'other',
      familyConfidence: 0,
    })
  })

  it('maps AI titles into ai_engineer', () => {
    expect(normalizeTitleFamily('AI Engineer')).toMatchObject({
      normalizedFamily: 'ai_engineer',
      familyConfidence: 1,
    })
    expect(normalizeTitleFamily('Machine Learning Engineer')).toMatchObject({
      normalizedFamily: 'ai_engineer',
      familyConfidence: 1,
    })
  })
})

describe('computeRelevantJobScore', () => {
  it('scores a relevant job up to the 0.90 maximum without any domain component', () => {
    const score = computeRelevantJobScore(buildOpportunity(), preferences, resume)

    expect(score).toEqual({
      titleFamilyPoints: 0.5,
      seniorityPoints: 0,
      roleSignalPoints: 0.2,
      relevanceToTarget: 0.7,
    })
  })

  it('treats 0.60 as relevant at the boundary', () => {
    const boundaryOpportunity = buildOpportunity({
      normalizedTitle: {
        rawTitle: 'Software Engineer Mid',
        normalizedFamily: 'fullstack_engineer',
        normalizedSeniority: 'mid',
        familyConfidence: 0.5,
        seniorityConfidence: 1,
      },
      signalsMentioned: [],
    })

    expect(computeRelevantJobScore(boundaryOpportunity, preferences, resume).relevanceToTarget).toBe(0.7)
    expect(isRelevantJob(boundaryOpportunity, preferences, resume)).toBe(true)
  })

  it('rejects jobs normalized to other even if signals overlap', () => {
    const irrelevantOpportunity = buildOpportunity({
      normalizedTitle: normalizeTitleFamily('Solutions Engineer'),
      signalsMentioned: ['frontend'],
    })

    expect(isRelevantJob(irrelevantOpportunity, preferences, resume)).toBe(false)
  })
})

describe('isSparseResumeSignalInput', () => {
  it('marks sparse resumes using the agreed thresholds', () => {
    expect(
      isSparseResumeSignalInput({
        resumeId: 'resume-2',
        userId: 'user-1',
        skills: ['TypeScript', 'React'],
        experienceSignals: ['web applications'],
        roleSignals: [],
      }),
    ).toBe(true)
  })
})
