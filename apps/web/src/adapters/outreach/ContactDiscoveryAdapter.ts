import type { AttemptResult } from '@ceevee/types'
import type { IContactDiscoveryPort, ContactDiscoveryError, DiscoveredContact } from '@/ports/outbound/IContactDiscoveryPort'

export class ContactDiscoveryAdapter implements IContactDiscoveryPort {
  async discover(companyName: string): Promise<AttemptResult<ContactDiscoveryError, DiscoveredContact[]>> {
    return {
      success: false,
      error: { type: 'provider_unavailable', message: `Contact provider not configured for ${companyName}` },
      value: null,
    }
  }
}
