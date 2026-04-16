// Dependency injection container.
// The only place in the app where adapters are instantiated and wired to use cases.
// Route handlers and MCP tools import use cases from here — never directly from adapters.

import { OpenAICompanyDiscoveryAdapter } from '@/adapters/llm/OpenAICompanyDiscoveryAdapter'
import { OpenAIChatAssistantAdapter } from '@/adapters/llm/OpenAIChatAssistantAdapter'
import { SupabaseCareerProfileRepositoryAdapter } from '@/adapters/db/SupabaseCareerProfileRepositoryAdapter'
import { SupabaseOnboardingChatMessageRepositoryAdapter } from '@/adapters/db/SupabaseOnboardingChatMessageRepositoryAdapter'
import { SupabaseOnboardingSessionRepositoryAdapter } from '@/adapters/db/SupabaseOnboardingSessionRepositoryAdapter'
import { OpenAIOnboardingAssistantAdapter } from '@/adapters/llm/OpenAIOnboardingAssistantAdapter'
import { PdfParseResumeTextExtractorAdapter } from '@/adapters/resume/PdfParseResumeTextExtractorAdapter'
import { AdvanceOnboardingChatUseCase } from '@/application/AdvanceOnboardingChatUseCase'
import { AttachResumeToOnboardingSessionUseCase } from '@/application/AttachResumeToOnboardingSessionUseCase'
import { OpenAILearningResourceAdapter } from '@/adapters/llm/OpenAILearningResourceAdapter'
import { AskChatUseCase } from '@/application/AskChatUseCase'
import { CareerPageAdapter } from '@/adapters/career-pages/CareerPageAdapter'
import { CompleteOnboardingUseCase } from '@/application/CompleteOnboardingUseCase'
import { ListOnboardingChatMessagesUseCase } from '@/application/ListOnboardingChatMessagesUseCase'
import { ResolveUserOnboardingStateUseCase } from '@/application/ResolveUserOnboardingStateUseCase'
import { StartOrResumeOnboardingSessionUseCase } from '@/application/StartOrResumeOnboardingSessionUseCase'
import { SupabaseResumeRepositoryAdapter } from '@/adapters/db/SupabaseResumeRepositoryAdapter'
import { SupabaseResumeStorageAdapter } from '@/adapters/storage/SupabaseResumeStorageAdapter'
import { SupabaseMentorPreferenceAdapter } from '@/adapters/db/SupabaseMentorPreferenceAdapter'
import { SupabaseResumeSignalAdapter } from '@/adapters/db/SupabaseResumeSignalAdapter'
import { SupabaseJobOpportunitySignalAdapter } from '@/adapters/db/SupabaseJobOpportunitySignalAdapter'
import { SupabaseSkillGapApplicationHistoryAdapter } from '@/adapters/db/SupabaseSkillGapApplicationHistoryAdapter'
import { SupabaseUserDeclaredSkillAdapter } from '@/adapters/db/SupabaseUserDeclaredSkillAdapter'
import { SupabaseLearningProgressAdapter } from '@/adapters/db/SupabaseLearningProgressAdapter'
import { DiscoverCompaniesUseCase } from '@/application/DiscoverCompaniesUseCase'
import { FetchCareerPageJobsUseCase } from '@/application/FetchCareerPageJobsUseCase'
import { UploadResumeUseCase } from '@/application/UploadResumeUseCase'
import { GenerateSkillGapPlanUseCase } from '@/application/GenerateSkillGapPlanUseCase'
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
  const chatAssistant = new OpenAIChatAssistantAdapter(env.openai.apiKey(), env.openai.chatModel())

  return new AskChatUseCase(chatAssistant)
}) satisfies () => AskChatUseCase)

export const fetchCareerPageJobsUseCase = lazyExecute((() => {
  const careerPages = new CareerPageAdapter()
  return new FetchCareerPageJobsUseCase(careerPages)
}) satisfies () => FetchCareerPageJobsUseCase)

export const uploadResumeUseCase = lazyExecute((() => {
  const resumeRepository = new SupabaseResumeRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )
  const resumeStorage = new SupabaseResumeStorageAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )

  return new UploadResumeUseCase(resumeStorage, resumeRepository)
}) satisfies () => UploadResumeUseCase)

export const resolveUserOnboardingStateUseCase = lazyExecute((() => {
  const careerProfiles = new SupabaseCareerProfileRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )
  const onboardingSessions = new SupabaseOnboardingSessionRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )

  return new ResolveUserOnboardingStateUseCase(careerProfiles, onboardingSessions)
}) satisfies () => ResolveUserOnboardingStateUseCase)

export const startOrResumeOnboardingSessionUseCase = lazyExecute((() => {
  const onboardingSessions = new SupabaseOnboardingSessionRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )

  return new StartOrResumeOnboardingSessionUseCase(onboardingSessions)
}) satisfies () => StartOrResumeOnboardingSessionUseCase)

export const attachResumeToOnboardingSessionUseCase = lazyExecute((() => {
  const resumeRepository = new SupabaseResumeRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )
  const resumeStorage = new SupabaseResumeStorageAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )
  const onboardingSessions = new SupabaseOnboardingSessionRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )
  const resumeTextExtractor = new PdfParseResumeTextExtractorAdapter()
  const uploadResume = new UploadResumeUseCase(resumeStorage, resumeRepository)

  return new AttachResumeToOnboardingSessionUseCase(
    uploadResume,
    onboardingSessions,
    resumeTextExtractor,
  )
}) satisfies () => AttachResumeToOnboardingSessionUseCase)

export const listOnboardingChatMessagesUseCase = lazyExecute((() => {
  const onboardingMessages = new SupabaseOnboardingChatMessageRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )

  return new ListOnboardingChatMessagesUseCase(onboardingMessages)
}) satisfies () => ListOnboardingChatMessagesUseCase)

export const advanceOnboardingChatUseCase = lazyExecute((() => {
  const onboardingSessions = new SupabaseOnboardingSessionRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )
  const onboardingMessages = new SupabaseOnboardingChatMessageRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )
  const onboardingAssistant = new OpenAIOnboardingAssistantAdapter(
    env.openai.apiKey(),
    env.openai.chatModel(),
  )

  return new AdvanceOnboardingChatUseCase(
    onboardingSessions,
    onboardingMessages,
    onboardingAssistant,
  )
}) satisfies () => AdvanceOnboardingChatUseCase)

export const completeOnboardingUseCase = lazyExecute((() => {
  const onboardingSessions = new SupabaseOnboardingSessionRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )
  const onboardingMessages = new SupabaseOnboardingChatMessageRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )
  const careerProfiles = new SupabaseCareerProfileRepositoryAdapter(
    env.supabase.url(),
    env.supabase.serviceRoleKey(),
  )

  return new CompleteOnboardingUseCase(
    onboardingSessions,
    onboardingMessages,
    careerProfiles,
  )
}) satisfies () => CompleteOnboardingUseCase)

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
