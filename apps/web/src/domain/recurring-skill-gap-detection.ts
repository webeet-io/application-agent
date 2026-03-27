import type { SkillGapKind } from './skill-gap'

export type DetectedRecurringGap = {
  name: string
  kind: SkillGapKind
  frequencyAcrossJobs: number
  confidence: number
  evidence: {
    jobsMatched: number
    exampleJobTitles: string[]
    missingFromResume: boolean
    contradictedByUserInput: boolean
  }
}

type ResumeSignal = {
  skills: string[]
  experienceSignals: string[]
  roleSignals: string[]
}

type OpportunitySignal = {
  jobId: string
  title: string
  skillsMentioned: string[]
  signalsMentioned: string[]
  relevance: number
}

export function detectRecurringGaps(
  resume: ResumeSignal,
  opportunities: OpportunitySignal[]
): DetectedRecurringGap[] {
  const missingMap = new Map<string, DetectedRecurringGap>()

  for (const job of opportunities) {
    const skillsToCheck = [...job.skillsMentioned, ...job.signalsMentioned]
    for (const skill of skillsToCheck) {
      if (resume.skills.includes(skill) || resume.experienceSignals.includes(skill) || resume.roleSignals.includes(skill)) {
        continue
      }
      const existing = missingMap.get(skill)
      if (existing) {
        existing.frequencyAcrossJobs += 1
        existing.evidence.jobsMatched += 1
        continue
      }
      missingMap.set(skill, {
        name: skill,
        kind: 'hard_skill',
        frequencyAcrossJobs: 1,
        confidence: 0.5,
        evidence: {
          jobsMatched: 1,
          exampleJobTitles: [job.title],
          missingFromResume: true,
          contradictedByUserInput: false,
        },
      })
    }
  }

  return Array.from(missingMap.values())
}
