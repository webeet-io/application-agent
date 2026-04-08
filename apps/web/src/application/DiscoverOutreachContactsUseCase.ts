import type { AttemptResult } from '@ceevee/types'
import type { IContactDiscoveryPort, ContactDiscoveryError, DiscoveredContact } from '@/ports/outbound/IContactDiscoveryPort'

export class DiscoverOutreachContactsUseCase {
  constructor(private readonly discovery: IContactDiscoveryPort) {}

  async execute(companyName: string, companyDomain?: string): Promise<AttemptResult<ContactDiscoveryError, DiscoveredContact[]>> {
    const result = await this.discovery.discover(companyName, companyDomain)
    if (!result.success) return result

    const sorted = [...result.value].sort((a, b) => b.confidence - a.confidence)
    return { success: true, error: null, value: sorted.slice(0, 3) }
  }
}
