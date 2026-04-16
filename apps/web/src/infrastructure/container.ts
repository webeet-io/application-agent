// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { CareerPageAdapter } from '@/adapters/career-pages/CareerPageAdapter'
import { SupabaseJobOpportunitySignalAdapter } from '@/adapters/db/SupabaseJobOpportunitySignalAdapter'
import { SupabaseLearningProgressAdapter } from '@/adapters/db/SupabaseLearningProgressAdapter'
import { SupabaseMentorPreferenceAdapter } from '@/adapters/db/SupabaseMentorPreferenceAdapter'
import { SupabaseOutreachRepositoryAdapter } from '@/adapters/db/SupabaseOutreachRepositoryAdapter'
import { SupabaseResumeRepositoryAdapter } from '@/adapters/db/SupabaseResumeRepositoryAdapter'
import { SupabaseResumeSignalAdapter } from '@/adapters/db/SupabaseResumeSignalAdapter'
import { SupabaseSkillGapApplicationHistoryAdapter } from '@/adapters/db/SupabaseSkillGapApplicationHistoryAdapter'
import { SupabaseUserDeclaredSkillAdapter } from '@/adapters/db/SupabaseUserDeclaredSkillAdapter'
import { OpenAIChatAssistantAdapter } from '@/adapters/llm/OpenAIChatAssistantAdapter'
import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { OpenAILearningResourceAdapter } from '@/adapters/llm/OpenAILearningResourceAdapter'
import { ContactDiscoveryAdapter } from '@/adapters/outreach/ContactDiscoveryAdapter'
import { EmailDraftAdapter } from '@/adapters/outreach/EmailDraftAdapter'
import { EmailValidationAdapter } from '@/adapters/outreach/EmailValidationAdapter'
import { SupabaseResumeStorageAdapter } from '@/adapters/storage/SupabaseResumeStorageAdapter'
import { AskChatUseCase } from '@/application/AskChatUseCase'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { DiscoverOutreachContactsUseCase } from '@/application/DiscoverOutreachContactsUseCase'
import { DraftOutreachEmailUseCase } from '@/application/DraftOutreachEmailUseCase'
import { FetchCareerPageJobsUseCase } from '@/application/FetchCareerPageJobsUseCase'
import { GenerateSkillGapPlanUseCase } from '@/application/GenerateSkillGapPlanUseCase'
import { LogOutreachUseCase } from '@/application/LogOutreachUseCase'
import { UploadResumeUseCase } from '@/application/UploadResumeUseCase'
import { ValidateOutreachEmailsUseCase } from '@/application/ValidateOutreachEmailsUseCase'
import { env } from './env'

function lazyExecute<TArgs extends unknown[], TResult>(
  factory: () => { execute: (...args: TArgs) => TResult },
) {
  let instance: { execute: (...args: TArgs) => TResult } | null = null

  return {
    execute: (...args: TArgs) => {
      if (!instance) {
        instance = factory()
      }

      return instance.execute(...args)
    },
  }
}

export const discoverCompaniesUseCase = lazyExecute((() => {
  const companyDiscovery = new OpenAICompanyDiscoveryAdapter(env.openai.apiKey())
  return new DiscoverCompaniesUseCase(companyDiscovery)
}) satisfies () => DiscoverCompaniesUseCase)

export const askChatUseCase = lazyExecute((() => {
  const chatAssistant = new OpenAIChatAssistantAdapter(
    env.openai.apiKey(),
    env.openai.chatModel(),
  )

  return new AskChatUseCase(chatAssistant)
}) satisfies () => AskChatUseCase)

export const fetchCareerPageJobsUseCase = lazyExecute((() => {
  const careerPages = new CareerPageAdapter()
  return new FetchCareerPageJobsUseCase(careerPages)
}) satisfies () => FetchCareerPageJobsUseCase)

export const uploadResumeUseCase = lazyExecute((() => {
  const resumeRepository = new SupabaseResumeRepositoryAdapter(env.supabase.url(), env.supabase.serviceRoleKey())
  const resumeStorage = new SupabaseResumeStorageAdapter(env.supabase.url(), env.supabase.serviceRoleKey())

  return new UploadResumeUseCase(resumeStorage, resumeRepository)
}) satisfies () => UploadResumeUseCase)

export const discoverOutreachContactsUseCase = lazyExecute((() => {
  const contactDiscovery = new ContactDiscoveryAdapter()
  return new DiscoverOutreachContactsUseCase(contactDiscovery)
}) satisfies () => DiscoverOutreachContactsUseCase)

export const validateOutreachEmailsUseCase = lazyExecute((() => {
  const emailValidation = new EmailValidationAdapter()
  return new ValidateOutreachEmailsUseCase(emailValidation)
}) satisfies () => ValidateOutreachEmailsUseCase)

export const draftOutreachEmailUseCase = lazyExecute((() => {
  const emailDrafting = new EmailDraftAdapter()
  return new DraftOutreachEmailUseCase(emailDrafting)
}) satisfies () => DraftOutreachEmailUseCase)

export const logOutreachUseCase = lazyExecute((() => {
  const outreachRepository = new SupabaseOutreachRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )

  return new LogOutreachUseCase(outreachRepository)
}) satisfies () => LogOutreachUseCase)

export const generateSkillGapPlanUseCase = lazyExecute((() => {
  const supabaseUrl = env.supabase.url()
  const serviceRoleKey = env.supabase.serviceRoleKey()

  return new GenerateSkillGapPlanUseCase({
    mentorSkillGapPreferencePort: new SupabaseMentorPreferenceAdapter(supabaseUrl, serviceRoleKey),
    resumeSignalPort: new SupabaseResumeSignalAdapter(supabaseUrl, serviceRoleKey),
    jobOpportunitySignalPort: new SupabaseJobOpportunitySignalAdapter(supabaseUrl, serviceRoleKey),
    applicationHistoryPort: new SupabaseSkillGapApplicationHistoryAdapter(supabaseUrl, serviceRoleKey),
    userDeclaredSkillPort: new SupabaseUserDeclaredSkillAdapter(supabaseUrl, serviceRoleKey),
    learningProgressPort: new SupabaseLearningProgressAdapter(supabaseUrl, serviceRoleKey),
    learningResourcePort: new OpenAILearningResourceAdapter(env.openai.apiKey(), env.openai.chatModel()),
  })
}) satisfies () => GenerateSkillGapPlanUseCase)
