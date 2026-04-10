import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  AttemptResult,
  OnboardingChatMessage,
  OnboardingChatMessageId,
  OnboardingChatRole,
  OnboardingSessionId,
} from '@ceevee/types'
import type {
  IOnboardingChatMessageRepositoryPort,
  OnboardingChatMessageRepositoryError,
} from '@/ports/outbound/IOnboardingChatMessageRepositoryPort'

interface OnboardingChatMessageRow {
  id: string
  session_id: string
  user_id: string
  role: OnboardingChatRole
  content: string
  created_at: string
}

function isMissingOnboardingChatSchema(message: string): boolean {
  return (
    message.includes('onboarding_chat_messages') &&
    (message.includes('does not exist') || message.includes('schema cache'))
  )
}

function toOnboardingChatMessage(row: OnboardingChatMessageRow): OnboardingChatMessage {
  return {
    id: row.id as OnboardingChatMessageId,
    sessionId: row.session_id as OnboardingSessionId,
    userId: row.user_id,
    role: row.role,
    content: row.content,
    createdAt: new Date(row.created_at),
  }
}

export class SupabaseOnboardingChatMessageRepositoryAdapter
  implements IOnboardingChatMessageRepositoryPort
{
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async listBySession(input: {
    userId: string
    sessionId: OnboardingSessionId
  }): Promise<AttemptResult<OnboardingChatMessageRepositoryError, OnboardingChatMessage[]>> {
    const { data, error } = await this.client
      .from('onboarding_chat_messages')
      .select('*')
      .eq('user_id', input.userId)
      .eq('session_id', input.sessionId)
      .order('created_at', { ascending: true })
      .returns<OnboardingChatMessageRow[]>()

    if (error) {
      if (isMissingOnboardingChatSchema(error.message)) {
        return { success: true, error: null, value: [] }
      }

      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    return {
      success: true,
      error: null,
      value: (data ?? []).map(toOnboardingChatMessage),
    }
  }

  async save(input: {
    userId: string
    sessionId: OnboardingSessionId
    role: OnboardingChatRole
    content: string
  }): Promise<AttemptResult<OnboardingChatMessageRepositoryError, OnboardingChatMessage>> {
    const { data, error } = await this.client
      .from('onboarding_chat_messages')
      .insert({
        user_id: input.userId,
        session_id: input.sessionId,
        role: input.role,
        content: input.content,
      })
      .select('*')
      .single<OnboardingChatMessageRow>()

    if (error) {
      if (isMissingOnboardingChatSchema(error.message)) {
        return { success: false, error: { type: 'not_found', sessionId: input.sessionId }, value: null }
      }

      return { success: false, error: { type: 'db_error', message: error.message }, value: null }
    }

    return { success: true, error: null, value: toOnboardingChatMessage(data) }
  }
}
