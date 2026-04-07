import type { ICareerPagePort, CareerPageResult, CareerPageError } from '@/ports/outbound/ICareerPagePort'
import type { AttemptResult } from '@ceevee/types'

export class CareerPageAdapter implements ICareerPagePort {
  async fetchJobs(_url: string): Promise<AttemptResult<CareerPageError, CareerPageResult>> {
    throw new Error('Not implemented')
  }
}
