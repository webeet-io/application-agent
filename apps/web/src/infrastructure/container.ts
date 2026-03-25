// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { SupabaseResumeRepositoryAdapter } from '@/adapters/db/SupabaseResumeRepositoryAdapter'
import { SupabaseResumeStorageAdapter } from '@/adapters/storage/SupabaseResumeStorageAdapter'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { UploadResumeUseCase } from '@/application/UploadResumeUseCase'
import { env } from './env'

// Adapters
const companyDiscovery = new OpenAICompanyDiscoveryAdapter(env.openai.apiKey())
const resumeRepository = new SupabaseResumeRepositoryAdapter(env.supabase.url(), env.supabase.serviceRoleKey())
const resumeStorage = new SupabaseResumeStorageAdapter(env.supabase.url(), env.supabase.serviceRoleKey())

// Use cases
export const discoverCompaniesUseCase = new DiscoverCompaniesUseCase(companyDiscovery)
export const uploadResumeUseCase = new UploadResumeUseCase(resumeStorage, resumeRepository)
