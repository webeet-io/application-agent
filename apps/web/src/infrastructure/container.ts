// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { CareerPageAdapter } from '@/adapters/career-pages/CareerPageAdapter'
import { SupabaseApplicationRepositoryAdapter } from '@/adapters/db/SupabaseApplicationRepositoryAdapter'
import { SupabaseResumeRepositoryAdapter } from '@/adapters/db/SupabaseResumeRepositoryAdapter'
import { OpenAIChatAssistantAdapter } from '@/adapters/llm/OpenAIChatAssistantAdapter'
import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { SupabaseResumeStorageAdapter } from '@/adapters/storage/SupabaseResumeStorageAdapter'
import { AskChatUseCase } from '@/application/AskChatUseCase'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { FetchCareerPageJobsUseCase } from '@/application/FetchCareerPageJobsUseCase'
import { MarkApplicationAppliedUseCase } from '@/application/MarkApplicationAppliedUseCase'
import { UpdateApplicationStatusUseCase } from '@/application/UpdateApplicationStatusUseCase'
import { UploadResumeUseCase } from '@/application/UploadResumeUseCase'
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
const applicationRepository = new SupabaseApplicationRepositoryAdapter(env.supabase.url(), env.supabase.serviceRoleKey())

// Use cases
export const discoverCompaniesUseCase = new DiscoverCompaniesUseCase(companyDiscovery)
export const askChatUseCase = new AskChatUseCase(chatAssistant)
export const fetchCareerPageJobsUseCase = new FetchCareerPageJobsUseCase(careerPages)
export const uploadResumeUseCase = new UploadResumeUseCase(resumeStorage, resumeRepository)
export const markApplicationAppliedUseCase = new MarkApplicationAppliedUseCase(applicationRepository)
export const updateApplicationStatusUseCase = new UpdateApplicationStatusUseCase(applicationRepository)
