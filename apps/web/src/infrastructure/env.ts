// Centralised environment variable access.
// Throws at startup if a required variable is missing — fail fast, not at request time.
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

function requireValue(value: string | undefined, key: string): string {
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

// Next.js only exposes NEXT_PUBLIC_* variables to the browser when they are
// referenced statically. Dynamic lookups like process.env[key] work on the
// server, but become undefined in client bundles.
const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL
const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const env = {
  app: {
    url: () => publicAppUrl ?? 'http://localhost:3000',
  },
  openai: {
    apiKey: () => requireEnv('OPENAI_API_KEY'),
    chatModel: () => process.env.OPENAI_CHAT_MODEL ?? 'gpt-4.1-mini',
  },
  supabase: {
    url: () => requireValue(publicSupabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: () => requireValue(publicSupabaseAnonKey, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: () => requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  },
}
