import type { AttemptResult } from '@ceevee/types'
import {
  type DegradedMode,
  type LearningProgressEvent,
  type PrioritizedSkillGap,
  type SkillGapPlan,
  type SkillGapStrategyMode,
} from '../domain/mentor-skill-gap'
import { generateLearningPaths } from '../domain/mentor-learning-path-generation'
import { detectRecurringSkillGaps } from '../domain/mentor-recurring-skill-gap-detection'
import { deriveLearningProgressSnapshotForGap, recomputeResumeReadinessFromProgressLogs } from '../domain/mentor-skill-gap-progress'
import { prioritizeDetectedSkillGaps } from '../domain/mentor-skill-gap-prioritization'
import { isRelevantJob, isSparseResumeSignalInput } from '../domain/mentor-skill-gap-relevance'
import type { IJobOpportunitySignalPort } from '../ports/outbound/IJobOpportunitySignalPort'
import type { ILearningProgressPort } from '../ports/outbound/ILearningProgressPort'
import type { ILearningResourcePort } from '../ports/outbound/ILearningResourcePort'
import type { IMentorSkillGapPreferencePort } from '../ports/outbound/IMentorSkillGapPreferencePort'
import type { IResumeSignalPort } from '../ports/outbound/IResumeSignalPort'
import type { ISkillGapApplicationHistoryPort } from '../ports/outbound/ISkillGapApplicationHistoryPort'
import type { IUserDeclaredSkillPort } from '../ports/outbound/IUserDeclaredSkillPort'

export type GenerateSkillGapPlanInput = {
  userId: string
  strategyModeOverride?: SkillGapStrategyMode
}

export type GenerateSkillGapPlanError =
  | { type: 'preferences_not_found'; userId: string }
  | { type: 'resume_not_found'; userId: string }
  | { type: 'resume_signals_missing'; userId: string }
  | { type: 'opportunities_unavailable'; userId: string }
  | { type: 'unknown'; message: string }

export type GenerateSkillGapPlanPorts = {
  mentorSkillGapPreferencePort: IMentorSkillGapPreferencePort
  resumeSignalPort: IResumeSignalPort
  jobOpportunitySignalPort: IJobOpportunitySignalPort
  applicationHistoryPort: ISkillGapApplicationHistoryPort
  userDeclaredSkillPort: IUserDeclaredSkillPort
  learningProgressPort: ILearningProgressPort
  learningResourcePort?: ILearningResourcePort
}

export interface IGenerateSkillGapPlanUseCase {
  execute(input: GenerateSkillGapPlanInput): Promise<AttemptResult<GenerateSkillGapPlanError, SkillGapPlan>>
}

const isoNow = (): string => new Date().toISOString()

const toUnknownError = (message: string): AttemptResult<GenerateSkillGapPlanError, never> => ({
  success: false,
  error: { type: 'unknown', message },
  value: null,
})

const summarizePlan = (prioritizedGaps: PrioritizedSkillGap[]): string => {
  if (prioritizedGaps.length === 0) {
    return 'No prioritized skill gaps could be produced from the current inputs.'
  }

  const topGap = prioritizedGaps[0]
  return `Top priority gap: ${topGap.name}. ${prioritizedGaps.length} prioritized gaps generated.`
}

const summarizeFallback = (
  degradedMode: DegradedMode,
  relevantJobCount: number,
  hasApplicationHistory: boolean,
  isSparseResume: boolean,
): string => {
  if (relevantJobCount === 0) {
    return 'No relevant jobs were found, so no prioritized skill gaps or learning paths were generated.'
  }

  if (degradedMode === 'single_relevant_job') {
    return 'Only one relevant job was found, so the plan is based on limited market evidence.'
  }

  if (degradedMode === 'sparse_resume' || isSparseResume) {
    return 'Resume signals are sparse, so confidence is reduced and recommendations are conservative.'
  }

  if (degradedMode === 'contradictory_user_input') {
    return 'Some user-declared skills conflict with resume or progress evidence, so confidence was reduced.'
  }

  if (degradedMode === 'low_confidence_only') {
    return 'Only low-confidence gaps were identified, so no learning paths were generated.'
  }

  if (!hasApplicationHistory) {
    return 'Application history was unavailable, so the plan was generated from resume and job signals only.'
  }

  return 'No degraded-mode fallback was required.'
}

const resolveDegradedMode = ({
  relevantJobCount,
  isSparseResume,
  hasApplicationHistory,
  prioritizedGaps,
}: {
  relevantJobCount: number
  isSparseResume: boolean
  hasApplicationHistory: boolean
  prioritizedGaps: PrioritizedSkillGap[]
}): DegradedMode => {
  if (relevantJobCount === 1) {
    return 'single_relevant_job'
  }

  if (isSparseResume) {
    return 'sparse_resume'
  }

  if (prioritizedGaps.some((gap) => gap.contradictionMarker)) {
    return 'contradictory_user_input'
  }

  if (prioritizedGaps.length > 0 && prioritizedGaps.every((gap) => gap.priorityBucket === 'optional')) {
    return 'low_confidence_only'
  }

  if (!hasApplicationHistory) {
    return 'no_history'
  }

  return 'none'
}

const enrichPrioritizedGapsWithProgress = (
  prioritizedGaps: PrioritizedSkillGap[],
  progressEvents: LearningProgressEvent[],
): PrioritizedSkillGap[] =>
  prioritizedGaps.map((gap) => {
    const progressSnapshot = deriveLearningProgressSnapshotForGap(gap.name, gap.kind, progressEvents)
    const recommendation = recomputeResumeReadinessFromProgressLogs(gap, progressEvents)

    return {
      ...gap,
      readinessState:
        recommendation.status === 'ready_now'
          ? 'resume_ready'
          : progressSnapshot.currentStage === 'proof'
            ? 'demonstrated'
            : progressSnapshot.currentStage === 'practice' || progressSnapshot.currentStage === 'foundation'
              ? 'learning'
              : gap.readinessState,
      evidenceSnapshot: {
        ...gap.evidenceSnapshot,
        presentInProgressLogs: progressSnapshot.totalEvents > 0,
      },
      recommendation,
    }
  })

export class GenerateSkillGapPlanUseCase implements IGenerateSkillGapPlanUseCase {
  constructor(private readonly ports: GenerateSkillGapPlanPorts) {}

  async execute(input: GenerateSkillGapPlanInput): Promise<AttemptResult<GenerateSkillGapPlanError, SkillGapPlan>> {
    const preferencesResult = await this.ports.mentorSkillGapPreferencePort.findPreferencesByUser(input.userId)
    if (!preferencesResult.success) {
      return {
        success: false,
        error: { type: 'preferences_not_found', userId: input.userId },
        value: null,
      }
    }

    const resumeResult = await this.ports.resumeSignalPort.findCurrentResumeSignalsByUser(input.userId)
    if (!resumeResult.success) {
      if (resumeResult.error.type === 'resume_not_found') {
        return { success: false, error: { type: 'resume_not_found', userId: input.userId }, value: null }
      }

      if (resumeResult.error.type === 'resume_signals_missing') {
        return { success: false, error: { type: 'resume_signals_missing', userId: input.userId }, value: null }
      }

      return toUnknownError(resumeResult.error.message)
    }

    const opportunitiesResult = await this.ports.jobOpportunitySignalPort.findOpenOpportunitySignalsForUser(input.userId)
    if (!opportunitiesResult.success) {
      return {
        success: false,
        error: { type: 'opportunities_unavailable', userId: input.userId },
        value: null,
      }
    }

    const strategyMode = input.strategyModeOverride ?? preferencesResult.value.strategyMode
    const preferences = {
      ...preferencesResult.value,
      strategyMode,
    }

    const applicationHistoryResult = await this.ports.applicationHistoryPort.findApplicationHistorySignalsByUser(input.userId)
    const userDeclaredSkillsResult = await this.ports.userDeclaredSkillPort.findDeclaredSkillsByUser(input.userId)
    const progressEventsResult = await this.ports.learningProgressPort.listEventsForUser(input.userId)

    const applicationHistory = applicationHistoryResult.success ? applicationHistoryResult.value : []
    const userDeclaredSkills = userDeclaredSkillsResult.success ? userDeclaredSkillsResult.value : []
    const progressEvents = progressEventsResult.success ? progressEventsResult.value : []

    const relevantJobCount = opportunitiesResult.value.filter((opportunity) =>
      isRelevantJob(opportunity, preferences, resumeResult.value),
    ).length

    const detectedGaps = detectRecurringSkillGaps({
      resume: resumeResult.value,
      opportunities: opportunitiesResult.value,
      preferences,
      applicationHistory,
      userDeclaredSkills,
    })

    const prioritizedGaps = enrichPrioritizedGapsWithProgress(
      prioritizeDetectedSkillGaps(detectedGaps, strategyMode),
      progressEvents,
    )
    const learningPaths = generateLearningPaths(prioritizedGaps, strategyMode)

    let resourceRecommendations: SkillGapPlan['resourceRecommendations'] = undefined
    if (this.ports.learningResourcePort && learningPaths.length > 0) {
      const resourceResults = await Promise.all(
        learningPaths.map(async (path) => {
          const firstStep = path.steps[0]
          return this.ports.learningResourcePort!.recommendResources({
            gapName: path.gapName,
            gapKind: prioritizedGaps.find((gap) => gap.name === path.gapName)?.kind ?? 'hard_skill',
            strategyMode,
            learningObjective: firstStep.objective,
            bucket: firstStep.bucket,
          })
        }),
      )

      if (resourceResults.every((result) => result.success)) {
        resourceRecommendations = resourceResults.flatMap((result) => (result.success ? result.value : []))
      }
    }

    const isSparseResume = isSparseResumeSignalInput(resumeResult.value)
    const hasApplicationHistory = applicationHistory.length > 0
    const degradedMode = resolveDegradedMode({
      relevantJobCount,
      isSparseResume,
      hasApplicationHistory,
      prioritizedGaps,
    })
    const fallbackSummary = summarizeFallback(degradedMode, relevantJobCount, hasApplicationHistory, isSparseResume)

    return {
      success: true,
      error: null,
      value: {
        strategyMode,
        generatedAt: isoNow(),
        inputQuality: {
          hasRelevantJobs: relevantJobCount > 0,
          relevantJobCount,
          hasApplicationHistory,
          hasUserDeclaredSkills: userDeclaredSkills.length > 0,
          isSparseResume,
          degradedMode,
          fallbackSummary,
        },
        prioritizedGaps,
        learningPaths,
        resourceRecommendations,
        summary: summarizePlan(prioritizedGaps),
      },
    }
  }
}
