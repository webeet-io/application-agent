import type { AttemptResult } from '@ceevee/types'
import type { DiscoveredCompany } from '@/domain/company-discovery'

export type CompanyDiscoveryError =
  | { type: 'llm_call_failed'; message: string }
  | { type: 'parse_failed'; raw: string }

export interface ICompanyDiscoveryPort {
  discover(prompt: string): Promise<AttemptResult<CompanyDiscoveryError, DiscoveredCompany[]>>
}
