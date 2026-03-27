import type { DetectedRecurringGap } from './recurring-skill-gap-detection'

export type StrategyMode = 'get_hired_quickly' | 'long_term_growth' | 'balanced'

export type PriorityBucket = 'critical_now' | 'important_next' | 'strategic_later' | 'optional'

export type PrioritizedSkillGap = {
  name: string
  priorityBucket: PriorityBucket
  rankingScore: number
  strategyMode: StrategyMode
  whyRankedHere: string
}

export function prioritizeGaps(gaps: DetectedRecurringGap[], strategyMode: StrategyMode): PrioritizedSkillGap[] {
  return gaps
    .map((gap) => {
      const score = gap.frequencyAcrossJobs + gap.confidence
      let bucket: PriorityBucket = 'important_next'
      if (score >= 2) bucket = 'critical_now'
      if (gap.confidence < 0.4) bucket = 'optional'
      if (strategyMode === 'long_term_growth' && gap.frequencyAcrossJobs < 2) bucket = 'strategic_later'
      return {
        name: gap.name,
        priorityBucket: bucket,
        rankingScore: score,
        strategyMode,
        whyRankedHere: `frequency ${gap.frequencyAcrossJobs}, confidence ${gap.confidence}`,
      }
    })
    .sort((a, b) => b.rankingScore - a.rankingScore)
}
