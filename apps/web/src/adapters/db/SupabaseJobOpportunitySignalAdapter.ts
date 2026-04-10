import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { IJobOpportunitySignalPort, JobOpportunitySignalPortError } from '@/ports/outbound/IJobOpportunitySignalPort'
import type { AttemptResult } from '@ceevee/types'
import type { OpportunitySignalInput } from '@/domain/mentor-skill-gap'
import { normalizeTitleFamily } from '@/domain/mentor-skill-gap-relevance'

interface JobListingRow {
  id: string
  title: string
  description: string
}

// Minimal skill extraction from job description text.
// Looks for known technical keywords — MVP heuristic, no NLP required.
function extractSkillsFromText(text: string): string[] {
  const normalized = text.toLowerCase()
  const candidates = [
    'typescript', 'javascript', 'python', 'go', 'rust', 'java', 'kotlin', 'swift',
    'react', 'next.js', 'vue', 'angular', 'node.js', 'express', 'fastapi', 'django',
    'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
    'docker', 'kubernetes', 'terraform', 'aws', 'gcp', 'azure',
    'graphql', 'rest api', 'grpc', 'websockets',
    'ci/cd', 'github actions', 'jest', 'vitest', 'playwright',
    'figma', 'sql', 'vector databases', 'llm', 'openai',
  ]
  return candidates.filter((skill) => normalized.includes(skill))
}

function extractSignalsFromText(text: string): string[] {
  const normalized = text.toLowerCase()
  const signals = [
    'team lead', 'cross-functional', 'mentoring', 'production systems',
    'high traffic', 'distributed systems', 'startup', 'agile', 'scrum',
    'open source', 'technical documentation', 'code review',
  ]
  return signals.filter((s) => normalized.includes(s))
}

export class SupabaseJobOpportunitySignalAdapter implements IJobOpportunitySignalPort {
  private readonly client: SupabaseClient

  constructor(supabaseUrl: string, serviceRoleKey: string) {
    this.client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }

  async findOpenOpportunitySignalsForUser(
    _userId: string,
  ): Promise<AttemptResult<JobOpportunitySignalPortError, OpportunitySignalInput[]>> {
    // Job listings are not user-scoped — reads the global pool.
    // Future: filter by user's saved/applied companies or preferences.
    const { data, error } = await this.client
      .from('job_listings')
      .select('id, title, description')
      .order('fetched_at', { ascending: false })
      .limit(50)
      .returns<JobListingRow[]>()

    if (error) {
      return { success: false, error: { type: 'source_failed', message: error.message }, value: null }
    }

    const signals: OpportunitySignalInput[] = (data ?? []).map((row) => ({
      jobId: row.id,
      title: row.title,
      normalizedTitle: normalizeTitleFamily(row.title),
      skillsMentioned: extractSkillsFromText(row.description),
      signalsMentioned: extractSignalsFromText(row.description),
    }))

    return { success: true, error: null, value: signals }
  }
}
