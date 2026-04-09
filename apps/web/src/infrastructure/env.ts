// Centralised environment variable access.
// Throws at startup if a required variable is missing — fail fast, not at request time.
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  openai: {
    apiKey: () => requireEnv('OPENAI_API_KEY'),
    chatModel: () => process.env.OPENAI_CHAT_MODEL ?? 'gpt-4.1-mini',
  },
  supabase: {
    url: () => requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: () => requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: () => requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
}
