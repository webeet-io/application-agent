import type { AttemptResult } from '@ceevee/types'
import { detectRecurringGaps } from '@/domain/recurring-skill-gap-detection'
import { prioritizeGaps } from '@/domain/skill-gap-prioritization'

export class GenerateSkillGapPlanUseCase {
  async execute(userId: string, strategyMode: 'get_hired_quickly' | 'long_term_growth' | 'balanced'): Promise<AttemptResult<Error, unknown>> {
    const resume = await this.fetchResume(userId)
    const opportunities = await this.fetchOpportunities(userId)

    if (!resume || opportunities.length === 0) {
      return { success: false, error: new Error('Missing data'), value: null }
    }

    const gaps = detectRecurringGaps(resume, opportunities)
    const prioritized = prioritizeGaps(gaps, strategyMode)

    return { success: true, error: null, value: { strategyMode, prioritized } }
  }

  private async fetchResume(userId: string) {
    // TODO: replace with real port
    return { skills: [], experienceSignals: [], roleSignals: [], userId }
  }

  private async fetchOpportunities(userId: string) {
    // TODO: replace with job port
    return []
  }
}
