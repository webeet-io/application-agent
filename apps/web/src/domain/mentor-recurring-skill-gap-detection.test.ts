import { describe, expect, it } from 'vitest'
import type {
  ApplicationHistorySignalInput,
  MentorSkillGapPreferences,
  OpportunitySignalInput,
  ResumeSignalInput,
  UserDeclaredSkillInput,
} from './mentor-skill-gap'
import { detectRecurringSkillGaps } from './mentor-recurring-skill-gap-detection'
import { normalizeTitleFamily } from './mentor-skill-gap-relevance'

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
  roleSignals: ['frontend'],
}

const buildOpportunity = (
  title: string,
  skillsMentioned: string[],
  signalsMentioned: string[] = ['frontend'],
): OpportunitySignalInput => ({
  jobId: title.toLowerCase().replace(/\s+/g, '-'),
  title,
  normalizedTitle: normalizeTitleFamily(title),
  skillsMentioned,
  signalsMentioned,
})

describe('detectRecurringSkillGaps', () => {
  it('detects recurring gaps across relevant jobs only', () => {
    const opportunities = [
      buildOpportunity('Software Engineer Mid', ['Docker']),
      buildOpportunity('Software Engineer Senior', ['Docker', 'AWS']),
      {
        ...buildOpportunity('Solutions Engineer Mid', ['Docker']),
        normalizedTitle: normalizeTitleFamily('Solutions Engineer Mid'),
      },
    ]

    const gaps = detectRecurringSkillGaps({
      resume,
      opportunities,
      preferences,
    })

    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({
      name: 'docker',
      kind: 'hard_skill',
      jobsMatchedCount: 2,
      frequencyAcrossRelevantJobs: 1,
      isRecurring: true,
      contradictionMarker: false,
    })
  })

  it('suppresses one-off gaps when there are multiple relevant jobs', () => {
    const opportunities = [
      buildOpportunity('Software Engineer Mid', ['Docker']),
      buildOpportunity('Software Engineer Senior', ['AWS']),
    ]

    const gaps = detectRecurringSkillGaps({
      resume,
      opportunities,
      preferences,
    })

    expect(gaps).toEqual([])
  })

  it('marks contradictions and lowers confidence for unproven user claims', () => {
    const userDeclaredSkills: UserDeclaredSkillInput[] = [
      {
        name: 'Docker',
        confidence: 'high',
        evidence: null,
        isOnResume: false,
      },
    ]

    const gaps = detectRecurringSkillGaps({
      resume,
      opportunities: [
        buildOpportunity('Software Engineer Mid', ['Docker']),
        buildOpportunity('Software Engineer Senior', ['Docker']),
      ],
      preferences,
      userDeclaredSkills,
    })

    expect(gaps[0]).toMatchObject({
      name: 'docker',
      contradictionMarker: true,
      confidence: 0.3,
    })
    expect(gaps[0].evidence.contradictedByUserInput).toBe(true)
  })

  it('returns single-job candidates in degraded mode scenarios without labeling them recurring', () => {
    const gaps = detectRecurringSkillGaps({
      resume,
      opportunities: [buildOpportunity('Software Engineer Mid', ['Docker'])],
      preferences,
    })

    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({
      name: 'docker',
      isRecurring: false,
      confidence: 0.39,
      frequencyAcrossRelevantJobs: 1,
    })
  })

  it('reduces confidence for sparse resumes', () => {
    const sparseResume: ResumeSignalInput = {
      resumeId: 'resume-2',
      userId: 'user-1',
      skills: ['TypeScript', 'React'],
      experienceSignals: ['web applications'],
      roleSignals: [],
    }

    const gaps = detectRecurringSkillGaps({
      resume: sparseResume,
      opportunities: [
        buildOpportunity('Software Engineer Mid', ['Docker'], []),
        buildOpportunity('Software Engineer Senior', ['Docker'], []),
      ],
      preferences,
    })

    expect(gaps[0]).toMatchObject({
      name: 'docker',
      confidence: 0.45,
    })
  })

  it('uses application history to attach repeated-missing evidence without requiring it', () => {
    const applicationHistory: ApplicationHistorySignalInput[] = [
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
    ]

    const gaps = detectRecurringSkillGaps({
      resume,
      opportunities: [
        buildOpportunity('Software Engineer Mid', ['Docker']),
        buildOpportunity('Software Engineer Senior', ['Docker']),
      ],
      preferences,
      applicationHistory,
    })

    expect(gaps[0].evidence.repeatedInApplicationHistory).toBe(true)
  })
})
