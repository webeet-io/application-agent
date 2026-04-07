import type { AttemptResult } from '@ceevee/types'
import type { SkillGapPlan, SkillGapStrategyMode } from '@/domain/mentor-skill-gap'
import type { IJobOpportunitySignalPort } from '@/ports/outbound/IJobOpportunitySignalPort'
import type { ILearningProgressPort } from '@/ports/outbound/ILearningProgressPort'
import type { ILearningResourcePort } from '@/ports/outbound/ILearningResourcePort'
import type { IMentorSkillGapPreferencePort } from '@/ports/outbound/IMentorSkillGapPreferencePort'
import type { IResumeSignalPort } from '@/ports/outbound/IResumeSignalPort'
import type { ISkillGapApplicationHistoryPort } from '@/ports/outbound/ISkillGapApplicationHistoryPort'
import type { IUserDeclaredSkillPort } from '@/ports/outbound/IUserDeclaredSkillPort'

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
