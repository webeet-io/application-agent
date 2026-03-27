import { detectRecurringGaps } from './recurring-skill-gap-detection'
import { prioritizeGaps } from './skill-gap-prioritization'

describe('skill gap feature', () => {
  it('detects recurring gaps across jobs', () => {
    const resume = { skills: ['javascript'], experienceSignals: [], roleSignals: [] }
    const opportunities = [
      { jobId: '1', title: 'Backend Dev', skillsMentioned: ['docker'], signalsMentioned: [], relevance: 1 },
      { jobId: '2', title: 'Platform Dev', skillsMentioned: ['docker'], signalsMentioned: [], relevance: 0.9 },
    ]

    const gaps = detectRecurringGaps(resume, opportunities)
    expect(gaps.length).toBe(1)
    expect(gaps[0].frequencyAcrossJobs).toBe(2)
  })

  it('prioritizes gaps differently by strategy mode', () => {
    const gaps = [
      { name: 'docker', kind: 'hard_skill', frequencyAcrossJobs: 2, confidence: 0.9, evidence: { jobsMatched: 2, exampleJobTitles: [], missingFromResume: true, contradictedByUserInput: false } },
      { name: 'k8s', kind: 'hard_skill', frequencyAcrossJobs: 1, confidence: 0.5, evidence: { jobsMatched: 1, exampleJobTitles: [], missingFromResume: true, contradictedByUserInput: false } },
    ]

    const prioritized = prioritizeGaps(gaps, 'get_hired_quickly')
    expect(prioritized[0].priorityBucket).toBe('critical_now')
  })
})
