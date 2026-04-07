import OpenAI from 'openai'
import type { ICompanyDiscoveryPort, CompanyDiscoveryError } from '@/ports/outbound/ICompanyDiscoveryPort'
import type { AttemptResult } from '@ceevee/types'
import type { DiscoveredCompany } from '@/domain/company-discovery'
import { buildDiscoveryPrompt, parseDiscoveredCompanies } from '@/domain/company-discovery'

// Adapter responsibility: call OpenAI, translate the response into domain types.
// No business logic here — prompt building and response parsing live in the domain.
export class OpenAICompanyDiscoveryAdapter implements ICompanyDiscoveryPort {
  private readonly client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey })
  }

  async discover(prompt: string): Promise<AttemptResult<CompanyDiscoveryError, DiscoveredCompany[]>> {
    let raw: string

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: buildDiscoveryPrompt(prompt) }],
      })
      raw = response.choices[0]?.message?.content ?? ''
    } catch (err) {
      return {
        success: false,
        error: { type: 'llm_call_failed', message: err instanceof Error ? err.message : 'unknown error' },
        value: null,
      }
    }

    const companies = parseDiscoveredCompanies(raw)
    if (!companies) {
      return { success: false, error: { type: 'parse_failed', raw }, value: null }
    }

    return { success: true, error: null, value: companies }
  }
}
