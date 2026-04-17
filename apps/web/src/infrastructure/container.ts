// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { CareerPageAdapter } from '@/adapters/career-pages/CareerPageAdapter'
import { SupabaseApplicationRepositoryAdapter } from '@/adapters/db/SupabaseApplicationRepositoryAdapter'
import { SupabaseJobOpportunitySignalAdapter } from '@/adapters/db/SupabaseJobOpportunitySignalAdapter'
import { SupabaseLearningProgressAdapter } from '@/adapters/db/SupabaseLearningProgressAdapter'
import { SupabaseMentorPreferenceAdapter } from '@/adapters/db/SupabaseMentorPreferenceAdapter'
import { SupabaseResumeRepositoryAdapter } from '@/adapters/db/SupabaseResumeRepositoryAdapter'
import { SupabaseResumeSignalAdapter } from '@/adapters/db/SupabaseResumeSignalAdapter'
import { SupabaseSkillGapApplicationHistoryAdapter } from '@/adapters/db/SupabaseSkillGapApplicationHistoryAdapter'
import { SupabaseUserDeclaredSkillAdapter } from '@/adapters/db/SupabaseUserDeclaredSkillAdapter'
import { OpenAIChatAssistantAdapter } from '@/adapters/llm/OpenAIChatAssistantAdapter'
import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { OpenAILearningResourceAdapter } from '@/adapters/llm/OpenAILearningResourceAdapter'
import { SupabaseResumeStorageAdapter } from '@/adapters/storage/SupabaseResumeStorageAdapter'
import { AskChatUseCase } from '@/application/AskChatUseCase'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { FetchCareerPageJobsUseCase } from '@/application/FetchCareerPageJobsUseCase'
import { GenerateSkillGapPlanUseCase } from '@/application/GenerateSkillGapPlanUseCase'
import { MarkApplicationAppliedUseCase } from '@/application/MarkApplicationAppliedUseCase'
import { UpdateApplicationStatusUseCase } from '@/application/UpdateApplicationStatusUseCase'
import { UploadResumeUseCase } from '@/application/UploadResumeUseCase'
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

export const markApplicationAppliedUseCase = lazyExecute((() => {
  const applicationRepository = new SupabaseApplicationRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )

  return new MarkApplicationAppliedUseCase(applicationRepository)
}) satisfies () => MarkApplicationAppliedUseCase)

export const updateApplicationStatusUseCase = lazyExecute((() => {
  const applicationRepository = new SupabaseApplicationRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )

  return new UpdateApplicationStatusUseCase(applicationRepository)
}) satisfies () => UpdateApplicationStatusUseCase)

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
