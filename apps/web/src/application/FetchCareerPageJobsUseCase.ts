import type { ICareerPagePort, CareerPageError, CareerPageResult } from '@/ports/outbound/ICareerPagePort'
import type { AttemptResult, ATSProvider } from '@ceevee/types'

// Use case responsibility: orchestrate ports and domain logic for a single user action.
export class FetchCareerPageJobsUseCase {
  constructor(private readonly careerPages: ICareerPagePort) {}

  execute(url: string, provider?: ATSProvider): Promise<AttemptResult<CareerPageError, CareerPageResult>> {
    return this.careerPages.fetchJobs(url, provider)
  }
}
