// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { OpenAIEmbeddingAdapter } from '@/adapters/llm/OpenAIEmbeddingAdapter'
import { SupabaseApplicationRepositoryAdapter } from '@/adapters/db/SupabaseApplicationRepositoryAdapter'
import { env } from './env'

// Adapters
const companyDiscovery = new OpenAICompanyDiscoveryAdapter(env.openai.apiKey())

export const embeddingAdapter = new OpenAIEmbeddingAdapter()
export const applicationRepository = new SupabaseApplicationRepositoryAdapter()

// Use cases
export const discoverCompaniesUseCase = new DiscoverCompaniesUseCase(companyDiscovery)