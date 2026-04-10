// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { OpenAIEmbeddingAdapter } from '@/adapters/llm/OpenAIEmbeddingAdapter'
import { SupabaseApplicationRepositoryAdapter } from '@/adapters/db/SupabaseApplicationRepositoryAdapter'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { OpenAIEmbeddingAdapter } from '@/adapters/llm/OpenAIEmbeddingAdapter'
import { SupabaseApplicationRepositoryAdapter } from '@/adapters/db/SupabaseApplicationRepositoryAdapter'
import { env } from './env'

// 1. Instantiate Adapters
const companyDiscovery = new OpenAICompanyDiscoveryAdapter(env.openai.apiKey())
const embeddingProvider = new OpenAIEmbeddingAdapter()
const applicationRepository = new SupabaseApplicationRepositoryAdapter()

// 2. Instantiate Use cases
// Note: As you build new Use Cases (like "SearchSimilarApplications"), 
// you will pass 'embeddingProvider' and 'applicationRepository' into them here.
export const discoverCompaniesUseCase = new DiscoverCompaniesUseCase(companyDiscovery)

// 3. Export the new instances if needed for route handlers
export { embeddingProvider, applicationRepository }
