import { AttemptResult, Application, ApplicationInsight } from '@ceevee/types';

export type InsightGeneratorError = { type: 'api_error'; message: string };

export interface IInsightGeneratorPort {
  /**
   * Generates actionable career insights based on a new job and past applications.
   */
  generate(
    newJobDescription: string,
    pastApplications: Application[]
  ): Promise<AttemptResult<InsightGeneratorError, ApplicationInsight>>;
}