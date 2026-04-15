import type {
  ApplicationHistorySignalInput,
  DetectedRecurringGap,
  MentorSkillGapPreferences,
  OpportunitySignalInput,
  ResumeSignalInput,
  UserDeclaredSkillInput,
} from './mentor-skill-gap'
import {
  applyContradictionPenalty,
  assessUserDeclaredSkillContradiction,
  hasRepeatedMissingSkillInApplicationHistory,
} from './mentor-skill-gap-evidence'
import { computeRelevantJobScore, isRelevantJob, isSparseResumeSignalInput } from './mentor-skill-gap-relevance'

type DetectRecurringSkillGapsInput = {
  resume: ResumeSignalInput
  opportunities: OpportunitySignalInput[]
  preferences: MentorSkillGapPreferences
  applicationHistory?: ApplicationHistorySignalInput[]
  userDeclaredSkills?: UserDeclaredSkillInput[]
}

const EXPERIENCE_KEYWORDS = [
  'experience',
  'system design',
  'architecture',
  'deployment',
  'production',
  'leadership',
  'ownership',
  'mentoring',
]

const normalize = (value: string): string => value.trim().toLowerCase()

const classifyGapKind = (candidate: string, source: 'skill' | 'signal') => {
  if (source === 'skill') {
    return 'hard_skill' as const
  }

  return EXPERIENCE_KEYWORDS.some((keyword) => candidate.includes(keyword)) ? ('experience' as const) : ('signal' as const)
}

const buildUserSignalSet = (resume: ResumeSignalInput): Set<string> =>
  new Set(
    [...resume.skills, ...resume.experienceSignals, ...resume.roleSignals]
      .map(normalize)
      .filter((signal) => signal.length > 0),
  )

const buildUserDeclarationMap = (userDeclaredSkills: UserDeclaredSkillInput[]): Map<string, UserDeclaredSkillInput> =>
  new Map(userDeclaredSkills.map((skill) => [normalize(skill.name), skill]))

const uniqueSignals = (values: string[]): string[] => Array.from(new Set(values.map(normalize).filter(Boolean)))

export const detectRecurringSkillGaps = ({
  resume,
  opportunities,
  preferences,
  applicationHistory = [],
  userDeclaredSkills = [],
}: DetectRecurringSkillGapsInput): DetectedRecurringGap[] => {
  const resumeSignals = buildUserSignalSet(resume)
  const userDeclarationMap = buildUserDeclarationMap(userDeclaredSkills)
  const sparseResume = isSparseResumeSignalInput(resume)
  const relevantJobs = opportunities.filter((opportunity) => isRelevantJob(opportunity, preferences, resume))

  const candidateMap = new Map<string, DetectedRecurringGap>()

  for (const opportunity of relevantJobs) {
    const relevantJobScore = computeRelevantJobScore(opportunity, preferences, resume)
    const candidateSignals = new Map<string, 'skill' | 'signal'>()

    for (const name of uniqueSignals(opportunity.skillsMentioned)) {
      candidateSignals.set(name, 'skill')
    }

    for (const name of uniqueSignals(opportunity.signalsMentioned)) {
      if (!candidateSignals.has(name)) {
        candidateSignals.set(name, 'signal')
      }
    }

    for (const [candidateName, candidateSource] of candidateSignals) {
      if (resumeSignals.has(candidateName)) {
        continue
      }

      const declaration = userDeclarationMap.get(candidateName) ?? null
      const contradiction = assessUserDeclaredSkillContradiction(declaration, false, false)
      const existing = candidateMap.get(candidateName)

      const jobsMatchedCount = (existing?.jobsMatchedCount ?? 0) + 1
      const repeatedInApplicationHistory = hasRepeatedMissingSkillInApplicationHistory(applicationHistory, candidateName)
      let confidence =
        relevantJobs.length <= 1
          ? 0.39
          : jobsMatchedCount >= 4
            ? 0.9
            : jobsMatchedCount === 3
              ? 0.75
              : jobsMatchedCount === 2
                ? 0.6
                : 0.45

      if (sparseResume) {
        confidence = Math.max(0.1, Number((confidence - 0.15).toFixed(2)))
      }

      if (contradiction.confidencePenalty > 0) {
        confidence = applyContradictionPenalty(confidence, contradiction.confidencePenalty)
      }

      candidateMap.set(candidateName, {
        name: candidateName,
        kind: classifyGapKind(candidateName, candidateSource),
        frequencyAcrossRelevantJobs:
          relevantJobs.length === 0 ? 0 : Number((jobsMatchedCount / relevantJobs.length).toFixed(2)),
        jobsMatchedCount,
        targetRoleRelevance: Number(
          (
            ((existing?.targetRoleRelevance ?? 0) * (jobsMatchedCount - 1) + relevantJobScore.relevanceToTarget) /
            jobsMatchedCount
          ).toFixed(2),
        ),
        confidence,
        isRecurring: relevantJobs.length > 1 && jobsMatchedCount >= 2,
        contradictionMarker: contradiction.contradictionMarker,
        evidence: {
          jobsMatched: jobsMatchedCount,
          exampleJobTitles: existing
            ? Array.from(new Set([...existing.evidence.exampleJobTitles, opportunity.title])).slice(0, 3)
            : [opportunity.title],
          missingFromResume: true,
          contradictedByUserInput: contradiction.contradictionMarker,
          repeatedInApplicationHistory,
        },
      })
    }
  }

  return Array.from(candidateMap.values()).filter((gap) => {
    if (relevantJobs.length === 1) {
      return true
    }

    if (gap.jobsMatchedCount < 2) {
      return false
    }

    return gap.frequencyAcrossRelevantJobs >= 0.5
  })
}
