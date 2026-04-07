// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { CareerPageAdapter } from '@/adapters/career-pages/CareerPageAdapter'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { FetchCareerPageJobsUseCase } from '@/application/FetchCareerPageJobsUseCase'
import { env } from './env'

// Adapters
const companyDiscovery = new OpenAICompanyDiscoveryAdapter(env.openai.apiKey())
const careerPages = new CareerPageAdapter()

// Use cases
export const discoverCompaniesUseCase = new DiscoverCompaniesUseCase(companyDiscovery)
export const fetchCareerPageJobsUseCase = new FetchCareerPageJobsUseCase(careerPages)
