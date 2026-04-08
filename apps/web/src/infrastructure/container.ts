// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { SupabaseOutreachRepositoryAdapter } from '@/adapters/db/SupabaseOutreachRepositoryAdapter'
import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { ContactDiscoveryAdapter } from '@/adapters/outreach/ContactDiscoveryAdapter'
import { EmailDraftAdapter } from '@/adapters/outreach/EmailDraftAdapter'
import { EmailValidationAdapter } from '@/adapters/outreach/EmailValidationAdapter'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { DiscoverOutreachContactsUseCase } from '@/application/DiscoverOutreachContactsUseCase'
import { DraftOutreachEmailUseCase } from '@/application/DraftOutreachEmailUseCase'
import { LogOutreachUseCase } from '@/application/LogOutreachUseCase'
import { ValidateOutreachEmailsUseCase } from '@/application/ValidateOutreachEmailsUseCase'
import { env } from './env'

// Adapters
const companyDiscovery = new OpenAICompanyDiscoveryAdapter(env.openai.apiKey())
const contactDiscovery = new ContactDiscoveryAdapter()
const emailValidation = new EmailValidationAdapter()
const emailDrafting = new EmailDraftAdapter()
const outreachRepository = new SupabaseOutreachRepositoryAdapter(
  env.supabase.url(),
  env.supabase.serviceRoleKey(),
)

// Use cases
export const discoverCompaniesUseCase = new DiscoverCompaniesUseCase(companyDiscovery)
export const discoverOutreachContactsUseCase = new DiscoverOutreachContactsUseCase(contactDiscovery)
export const validateOutreachEmailsUseCase = new ValidateOutreachEmailsUseCase(emailValidation)
export const draftOutreachEmailUseCase = new DraftOutreachEmailUseCase(emailDrafting)
export const logOutreachUseCase = new LogOutreachUseCase(outreachRepository)
