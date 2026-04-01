// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { SupabaseApplicationRepositoryAdapter } from '@/adapters/db/SupabaseApplicationRepositoryAdapter'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { MarkApplicationAppliedUseCase } from '@/application/MarkApplicationAppliedUseCase'
import { UpdateApplicationStatusUseCase } from '@/application/UpdateApplicationStatusUseCase'
import { env } from './env'

// Adapters
const companyDiscovery = new OpenAICompanyDiscoveryAdapter(env.openai.apiKey())
const applicationRepository = new SupabaseApplicationRepositoryAdapter(env.supabase.url(), env.supabase.serviceRoleKey())

// Use cases
export const discoverCompaniesUseCase = new DiscoverCompaniesUseCase(companyDiscovery)
export const markApplicationAppliedUseCase = new MarkApplicationAppliedUseCase(applicationRepository)
export const updateApplicationStatusUseCase = new UpdateApplicationStatusUseCase(applicationRepository)
