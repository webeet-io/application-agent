import type {
  EstimatedEffort,
  LearningPath,
  LearningPathBucket,
  LearningPathStep,
  PrioritizedSkillGap,
  SkillGapStrategyMode,
  WhyNowReason,
} from './mentor-skill-gap'

const DEPENDENCY_ORDER: Record<string, number> = {
  docker: 10,
  kubernetes: 20,
  aws: 30,
  'system design experience': 40,
}

const getDependencyRank = (gapName: string): number => DEPENDENCY_ORDER[gapName.trim().toLowerCase()] ?? 999

const buildEstimatedEffort = (gap: PrioritizedSkillGap): EstimatedEffort => {
  const baseEffortByKind: Record<PrioritizedSkillGap['kind'], EstimatedEffort> = {
    hard_skill: {
      band: 'medium',
      minWeeks: 2,
      maxWeeks: 4,
      anchor: 'project_proof',
      confidence: 'high',
    },
    experience: {
      band: 'long',
      minWeeks: 6,
      maxWeeks: 10,
      anchor: 'real_context_repetition',
      confidence: 'medium',
    },
    signal: {
      band: 'medium',
      minWeeks: 4,
      maxWeeks: 6,
      anchor: 'project_proof',
      confidence: 'medium',
    },
  }

  const base = baseEffortByKind[gap.kind]

  if (gap.priorityBucket === 'critical_now' && gap.kind === 'hard_skill') {
    return {
      band: 'medium',
      minWeeks: 2,
      maxWeeks: 3,
      anchor: 'project_proof',
      confidence: 'high',
    }
  }

  if (gap.priorityBucket === 'strategic_later' && gap.kind !== 'hard_skill') {
    return {
      ...base,
      maxWeeks: base.maxWeeks + 2,
    }
  }

  return base
}

const buildPathBuckets = (strategyMode: SkillGapStrategyMode): [LearningPathBucket, LearningPathBucket, LearningPathBucket] => {
  if (strategyMode === 'get_hired_quickly') {
    return ['now', 'now', 'next']
  }

  if (strategyMode === 'long_term_growth') {
    return ['now', 'next', 'later']
  }

  return ['now', 'next', 'later']
}

const buildStepWhy = (gap: PrioritizedSkillGap, extra: WhyNowReason[] = []): WhyNowReason[] =>
  Array.from(new Set([...gap.whyNow, ...extra]))

const buildFoundationObjective = (gapName: string): string =>
  `Learn the core concepts of ${gapName} well enough to explain when and why to use it.`

const buildPracticeObjective = (gapName: string): string =>
  `Build or practice one concrete project task using ${gapName} in a realistic workflow.`

const buildProofObjective = (gapName: string): string =>
  `Produce evidence that ${gapName} was used hands-on and can be discussed credibly in applications.`

const buildExitCriteria = (gapName: string, stepType: LearningPathStep['stepType']): string[] => {
  if (stepType === 'foundation') {
    return [
      `Can explain the purpose and tradeoffs of ${gapName} in plain language`,
      `Can identify one realistic scenario where ${gapName} should be used`,
    ]
  }

  if (stepType === 'practice') {
    return [
      `Completed one hands-on exercise or project using ${gapName}`,
      `Can reproduce the basic workflow without copying a tutorial step-by-step`,
    ]
  }

  return [
    `Has one shareable artifact or work sample demonstrating ${gapName}`,
    `Can describe what was built, what went wrong, and how it was fixed`,
  ]
}

const buildStepEffort = (
  totalEffort: EstimatedEffort,
  stepType: LearningPathStep['stepType'],
): EstimatedEffort => {
  if (stepType === 'foundation') {
    return {
      ...totalEffort,
      band: totalEffort.band === 'long' ? 'medium' : 'short',
      minWeeks: 1,
      maxWeeks: Math.max(1, totalEffort.minWeeks - 1),
      anchor: 'foundation_plus_guided_practice',
    }
  }

  if (stepType === 'practice') {
    return {
      ...totalEffort,
      minWeeks: Math.max(1, totalEffort.minWeeks),
      maxWeeks: Math.max(totalEffort.minWeeks, totalEffort.maxWeeks - 1),
      anchor: 'project_proof',
    }
  }

  return {
    ...totalEffort,
    band: totalEffort.band === 'short' ? 'medium' : totalEffort.band,
    minWeeks: 1,
    maxWeeks: 2,
    anchor: 'real_context_repetition',
  }
}

export const generateLearningPathForGap = (
  gap: PrioritizedSkillGap,
  strategyMode: SkillGapStrategyMode,
): LearningPath => {
  const totalEstimatedEffort = buildEstimatedEffort(gap)
  const [foundationBucket, practiceBucket, proofBucket] = buildPathBuckets(strategyMode)

  const steps: LearningPathStep[] = [
    {
      order: 1,
      bucket: foundationBucket,
      gapName: gap.name,
      objective: buildFoundationObjective(gap.name),
      stepType: 'foundation',
      exitCriteria: buildExitCriteria(gap.name, 'foundation'),
      estimatedEffort: buildStepEffort(totalEstimatedEffort, 'foundation'),
      whyThisStep: buildStepWhy(gap, ['foundational_for_other_gaps']),
    },
    {
      order: 2,
      bucket: practiceBucket,
      gapName: gap.name,
      objective: buildPracticeObjective(gap.name),
      stepType: 'practice',
      exitCriteria: buildExitCriteria(gap.name, 'practice'),
      estimatedEffort: buildStepEffort(totalEstimatedEffort, 'practice'),
      whyThisStep: buildStepWhy(gap, ['low_effort_high_return']),
    },
    {
      order: 3,
      bucket: proofBucket,
      gapName: gap.name,
      objective: buildProofObjective(gap.name),
      stepType: 'proof',
      exitCriteria: buildExitCriteria(gap.name, 'proof'),
      estimatedEffort: buildStepEffort(totalEstimatedEffort, 'proof'),
      whyThisStep: buildStepWhy(gap, ['close_to_resume_ready']),
    },
  ]

  return {
    gapName: gap.name,
    steps,
    totalEstimatedEffort,
  }
}

export const generateLearningPaths = (
  prioritizedGaps: PrioritizedSkillGap[],
  strategyMode: SkillGapStrategyMode,
): LearningPath[] =>
  prioritizedGaps
    .filter((gap) => gap.priorityBucket !== 'optional')
    .sort((left, right) => {
      const dependencyDelta = getDependencyRank(left.name) - getDependencyRank(right.name)
      if (dependencyDelta !== 0) {
        return dependencyDelta
      }

      return right.rankingScore - left.rankingScore
    })
    .map((gap) => generateLearningPathForGap(gap, strategyMode))
