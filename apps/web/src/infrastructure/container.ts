// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { CareerPageAdapter } from '@/adapters/career-pages/CareerPageAdapter'
import { SupabaseOutreachRepositoryAdapter } from '@/adapters/db/SupabaseOutreachRepositoryAdapter'
import { SupabaseResumeRepositoryAdapter } from '@/adapters/db/SupabaseResumeRepositoryAdapter'
import { OpenAIChatAssistantAdapter } from '@/adapters/llm/OpenAIChatAssistantAdapter'
import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { ContactDiscoveryAdapter } from '@/adapters/outreach/ContactDiscoveryAdapter'
import { EmailDraftAdapter } from '@/adapters/outreach/EmailDraftAdapter'
import { EmailValidationAdapter } from '@/adapters/outreach/EmailValidationAdapter'
import { SupabaseResumeStorageAdapter } from '@/adapters/storage/SupabaseResumeStorageAdapter'
import { AskChatUseCase } from '@/application/AskChatUseCase'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { DiscoverOutreachContactsUseCase } from '@/application/DiscoverOutreachContactsUseCase'
import { DraftOutreachEmailUseCase } from '@/application/DraftOutreachEmailUseCase'
import { FetchCareerPageJobsUseCase } from '@/application/FetchCareerPageJobsUseCase'
import { LogOutreachUseCase } from '@/application/LogOutreachUseCase'
import { UploadResumeUseCase } from '@/application/UploadResumeUseCase'
import { ValidateOutreachEmailsUseCase } from '@/application/ValidateOutreachEmailsUseCase'
import { env } from './env'

// Adapters
const companyDiscovery = new OpenAICompanyDiscoveryAdapter(env.openai.apiKey())
const chatAssistant = new OpenAIChatAssistantAdapter(
  env.openai.apiKey(),
  env.openai.chatModel(),
)
const careerPages = new CareerPageAdapter()
const resumeRepository = new SupabaseResumeRepositoryAdapter(env.supabase.url(), env.supabase.serviceRoleKey())
const resumeStorage = new SupabaseResumeStorageAdapter(env.supabase.url(), env.supabase.serviceRoleKey())
const contactDiscovery = new ContactDiscoveryAdapter()
const emailValidation = new EmailValidationAdapter()
const emailDrafting = new EmailDraftAdapter()
const outreachRepository = new SupabaseOutreachRepositoryAdapter(
  env.supabase.url(),
  env.supabase.serviceRoleKey(),
)

// Use cases
export const discoverCompaniesUseCase = new DiscoverCompaniesUseCase(companyDiscovery)
export const askChatUseCase = new AskChatUseCase(chatAssistant)
export const fetchCareerPageJobsUseCase = new FetchCareerPageJobsUseCase(careerPages)
export const uploadResumeUseCase = new UploadResumeUseCase(resumeStorage, resumeRepository)
export const discoverOutreachContactsUseCase = new DiscoverOutreachContactsUseCase(contactDiscovery)
export const validateOutreachEmailsUseCase = new ValidateOutreachEmailsUseCase(emailValidation)
export const draftOutreachEmailUseCase = new DraftOutreachEmailUseCase(emailDrafting)
export const logOutreachUseCase = new LogOutreachUseCase(outreachRepository)
