import type { AttemptResult, OnboardingSession } from '@ceevee/types'

export interface OnboardingAssistantMessage {
  role: 'assistant' | 'user'
  content: string
}

export type OnboardingAssistantMode = 'kickoff' | 'reply'

export type OnboardingAssistantError =
  | { type: 'llm_call_failed'; message: string }
  | { type: 'empty_response' }

export interface IOnboardingAssistantPort {
  reply(input: {
    session: OnboardingSession
    messages: OnboardingAssistantMessage[]
    mode: OnboardingAssistantMode
  }): Promise<AttemptResult<OnboardingAssistantError, { reply: string }>>
}
