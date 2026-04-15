// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { OpenAIChatAssistantAdapter } from '@/adapters/llm/OpenAIChatAssistantAdapter'
import { AskChatUseCase } from '@/application/AskChatUseCase'
import { CareerPageAdapter } from '@/adapters/career-pages/CareerPageAdapter'
import { SupabaseResumeRepositoryAdapter } from '@/adapters/db/SupabaseResumeRepositoryAdapter'
import { SupabaseResumeStorageAdapter } from '@/adapters/storage/SupabaseResumeStorageAdapter'
import { SupabaseMentorPreferenceAdapter } from '@/adapters/db/SupabaseMentorPreferenceAdapter'
import { SupabaseResumeSignalAdapter } from '@/adapters/db/SupabaseResumeSignalAdapter'
import { SupabaseJobOpportunitySignalAdapter } from '@/adapters/db/SupabaseJobOpportunitySignalAdapter'
import { SupabaseSkillGapApplicationHistoryAdapter } from '@/adapters/db/SupabaseSkillGapApplicationHistoryAdapter'
import { SupabaseUserDeclaredSkillAdapter } from '@/adapters/db/SupabaseUserDeclaredSkillAdapter'
import { SupabaseLearningProgressAdapter } from '@/adapters/db/SupabaseLearningProgressAdapter'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { OpenAIEmbeddingAdapter } from '@/adapters/llm/OpenAIEmbeddingAdapter'
import { SupabaseApplicationRepositoryAdapter } from '@/adapters/db/SupabaseApplicationRepositoryAdapter'
import { FetchCareerPageJobsUseCase } from '@/application/FetchCareerPageJobsUseCase'
import { UploadResumeUseCase } from '@/application/UploadResumeUseCase'
import { GenerateSkillGapPlanUseCase } from '@/application/GenerateSkillGapPlanUseCase'
import { env } from './env'

// --- 1. Your new adapters safely ABOVE the function ---
export const embeddingAdapter = new OpenAIEmbeddingAdapter()
export const applicationRepository = new SupabaseApplicationRepositoryAdapter()

// --- 2. The lazyExecute wrapper function ---
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

// --- 3. The use case exports ---
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
    // learningResourcePort omitted — OpenAILearningResourceAdapter is a Phase 3 follow-up
  })
}) satisfies () => GenerateSkillGapPlanUseCase)