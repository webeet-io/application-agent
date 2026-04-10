import type {
  ApplicationHistorySignalInput,
  UserDeclaredSkillInput,
  WhyNowReason,
} from './mentor-skill-gap'

export const EVIDENCE_PRECEDENCE = [
  'resume_present',
  'progress_strong',
  'progress_moderate',
  'user_declared_high',
  'application_history_missing_repeated',
  'relevant_job_frequency',
  'user_declared_medium',
  'user_declared_low',
] as const

export type EvidencePrecedence = (typeof EVIDENCE_PRECEDENCE)[number]

export type ContradictionAssessment = {
  contradictionMarker: boolean
  confidencePenalty: number
  whyNowReason: WhyNowReason | null
}

export const assessUserDeclaredSkillContradiction = (
  declaration: UserDeclaredSkillInput | null,
  isPresentOnResume: boolean,
  hasModerateOrStrongProgressEvidence: boolean,
): ContradictionAssessment => {
  if (!declaration) {
    return {
      contradictionMarker: false,
      confidencePenalty: 0,
      whyNowReason: null,
    }
  }

  if (!declaration.isOnResume && (isPresentOnResume || hasModerateOrStrongProgressEvidence)) {
    return {
      contradictionMarker: false,
      confidencePenalty: 0,
      whyNowReason: null,
    }
  }

  if ((declaration.confidence === 'medium' || declaration.confidence === 'high') && !isPresentOnResume && !hasModerateOrStrongProgressEvidence) {
    return {
      contradictionMarker: true,
      confidencePenalty: declaration.confidence === 'high' ? 0.3 : 0.2,
      whyNowReason: 'contradicted_by_user_input',
    }
  }

  return {
    contradictionMarker: false,
    confidencePenalty: 0,
    whyNowReason: null,
  }
}

export const applyContradictionPenalty = (baseConfidence: number, penalty: number): number =>
  Math.max(0.1, Number((baseConfidence - penalty).toFixed(2)))

export const hasRepeatedMissingSkillInApplicationHistory = (
  applicationHistory: ApplicationHistorySignalInput[],
  gapName: string,
): boolean => {
  const normalizedGap = gapName.trim().toLowerCase()
  const repeatedCount = applicationHistory.filter((application) =>
    application.skillsMissing.some((skill) => skill.trim().toLowerCase() === normalizedGap),
  ).length

  return repeatedCount >= 2
}
