import type { AttemptResult } from '@ceevee/types'

export type ContactRole = 'vp_engineering' | 'engineering_manager' | 'team_lead' | 'hiring_manager' | 'other'

export type ContactDiscoveryError =
  | { type: 'provider_unavailable'; message: string }
  | { type: 'not_found'; company: string }
  | { type: 'provider_error'; message: string }

export type DiscoveredContact = {
  name: string
  role: ContactRole
  title: string
  email?: string
  source: string
  confidence: number
}

export interface IContactDiscoveryPort {
  discover(companyName: string, companyDomain?: string): Promise<AttemptResult<ContactDiscoveryError, DiscoveredContact[]>>
}
