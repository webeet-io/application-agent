import { describe, expect, it } from 'vitest'
import {
  EVIDENCE_PRECEDENCE,
  applyContradictionPenalty,
  assessUserDeclaredSkillContradiction,
  hasRepeatedMissingSkillInApplicationHistory,
} from './mentor-skill-gap-evidence'

describe('EVIDENCE_PRECEDENCE', () => {
  it('keeps the confirmed precedence order stable', () => {
    expect(EVIDENCE_PRECEDENCE).toEqual([
      'resume_present',
      'progress_strong',
      'progress_moderate',
      'user_declared_high',
      'application_history_missing_repeated',
      'relevant_job_frequency',
      'user_declared_medium',
      'user_declared_low',
    ])
  })
})

describe('assessUserDeclaredSkillContradiction', () => {
  it('marks a contradiction for high-confidence unproven user claims', () => {
    expect(
      assessUserDeclaredSkillContradiction(
        { name: 'Docker', confidence: 'high', evidence: null, isOnResume: false },
        false,
        false,
      ),
    ).toEqual({
      contradictionMarker: true,
      confidencePenalty: 0.3,
      whyNowReason: 'contradicted_by_user_input',
    })
  })

  it('does not mark a contradiction when moderate or strong progress evidence exists', () => {
    expect(
      assessUserDeclaredSkillContradiction(
        { name: 'Docker', confidence: 'high', evidence: null, isOnResume: false },
        false,
        true,
      ),
    ).toEqual({
      contradictionMarker: false,
      confidencePenalty: 0,
      whyNowReason: null,
    })
  })
})

describe('applyContradictionPenalty', () => {
  it('reduces confidence and respects the 0.10 floor', () => {
    expect(applyContradictionPenalty(0.8, 0.2)).toBe(0.6)
    expect(applyContradictionPenalty(0.2, 0.3)).toBe(0.1)
  })
})

describe('hasRepeatedMissingSkillInApplicationHistory', () => {
  it('requires at least two matching missing-skill occurrences', () => {
    const applications = [
      {
        applicationId: 'app-1',
        jobId: 'job-1',
        jobTitle: 'Backend Engineer',
        status: 'rejected' as const,
        outcome: 'rejected',
        rejectedReason: null,
        skillsPresent: ['node.js'],
        skillsMissing: ['docker'],
      },
      {
        applicationId: 'app-2',
        jobId: 'job-2',
        jobTitle: 'Fullstack Engineer',
        status: 'applied' as const,
        outcome: null,
        rejectedReason: null,
        skillsPresent: ['react'],
        skillsMissing: ['Docker'],
      },
    ]

    expect(hasRepeatedMissingSkillInApplicationHistory(applications, 'docker')).toBe(true)
  })
})
