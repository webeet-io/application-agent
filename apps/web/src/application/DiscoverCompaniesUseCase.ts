import type { ICompanyDiscoveryPort, CompanyDiscoveryError } from '@/ports/outbound/ICompanyDiscoveryPort'
import type { AttemptResult } from '@ceevee/types'
import type { DiscoveredCompany } from '@/domain/company-discovery'

// Use case responsibility: orchestrate ports and domain logic for a single user action.
// This use case will grow as we add deduplication, persistence, filtering, etc.
export class DiscoverCompaniesUseCase {
  constructor(private readonly discovery: ICompanyDiscoveryPort) {}

  execute(prompt: string): Promise<AttemptResult<CompanyDiscoveryError, DiscoveredCompany[]>> {
    return this.discovery.discover(prompt)
  }
}
