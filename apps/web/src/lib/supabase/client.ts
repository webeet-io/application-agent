import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/infrastructure/env'

export function createClient() {
  return createBrowserClient(
    env.supabase.url(),
    env.supabase.anonKey(),
  )
}
