import type { AttemptResult, ATSProvider } from '@ceevee/types'

export type JobListing = {
  title: string
  location: string
  url: string
  description: string
}

export type CareerPageResult = {
  jobs: JobListing[]
  atsProvider: ATSProvider
}

export type CareerPageError =
  | { type: 'fetch_failed'; url: string; message: string }
  | { type: 'ats_not_supported'; atsProvider: string }
  | { type: 'parse_failed'; raw: string }

export interface ICareerPagePort {
  fetchJobs(url: string, provider?: ATSProvider): Promise<AttemptResult<CareerPageError, CareerPageResult>>
}
