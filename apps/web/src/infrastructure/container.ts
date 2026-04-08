// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { OpenAIChatAssistantAdapter } from '@/adapters/llm/OpenAIChatAssistantAdapter'
import { AskChatUseCase } from '@/application/AskChatUseCase'
import { CareerPageAdapter } from '@/adapters/career-pages/CareerPageAdapter'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { FetchCareerPageJobsUseCase } from '@/application/FetchCareerPageJobsUseCase'
import { env } from './env'

// Adapters
const companyDiscovery = new OpenAICompanyDiscoveryAdapter(env.openai.apiKey())
const chatAssistant = new OpenAIChatAssistantAdapter(
  env.openai.apiKey(),
  env.openai.chatModel(),
)
const careerPages = new CareerPageAdapter()

// Use cases
export const discoverCompaniesUseCase = new DiscoverCompaniesUseCase(companyDiscovery)
export const askChatUseCase = new AskChatUseCase(chatAssistant)
export const fetchCareerPageJobsUseCase = new FetchCareerPageJobsUseCase(careerPages)
