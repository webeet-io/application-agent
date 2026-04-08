import { AttemptResult, ApplicationInsight } from '@ceevee/types';
import { IEmbeddingPort } from '../ports/outbound/IEmbeddingPort';
import { IApplicationRepositoryPort } from '../ports/outbound/IApplicationRepositoryPort';
import { IInsightGeneratorPort } from '../ports/outbound/IInsightGeneratorPort';

export type GenerateInsightError = 
  | { type: 'not_enough_data'; message: string }
  | { type: 'generation_failed'; message: string };

export class GenerateInsightsUseCase {
  constructor(
    private embeddingPort: IEmbeddingPort,
    private applicationRepo: IApplicationRepositoryPort,
    private insightGenerator: IInsightGeneratorPort
  ) {}

  async execute(newJobDescription: string): Promise<AttemptResult<GenerateInsightError, ApplicationInsight>> {
    // 1. Convert the new job description into a vector (Issue 10)
    const embeddingResult = await this.embeddingPort.generate(newJobDescription);
    if (!embeddingResult.success) {
      return { success: false, error: { type: 'generation_failed', message: 'Failed to embed job.' }, value: null };
    }

    // 2. Search the database for the k=5 most similar past applications
    const similarAppsResult = await this.applicationRepo.findSimilar(embeddingResult.value, 5);
    if (!similarAppsResult.success) {
      return { success: false, error: { type: 'generation_failed', message: 'Database search failed.' }, value: null };
    }

    const pastApps = similarAppsResult.value;

    // 3. Threshold check to avoid noise (requires at least 2 past applications)
    if (pastApps.length < 2) {
      return { 
        success: false, 
        error: { type: 'not_enough_data', message: 'Not enough similar applications to generate a reliable insight.' }, 
        value: null 
      };
    }

    // 4. Send the context to the LLM to generate the insight
    const insightResult = await this.insightGenerator.generate(newJobDescription, pastApps);
    if (!insightResult.success) {
      return { success: false, error: { type: 'generation_failed', message: 'AI generation failed.' }, value: null };
    }

    return { success: true, error: null, value: insightResult.value };
  }
}