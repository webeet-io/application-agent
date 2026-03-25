export type DiscoveredCompany = {
  name: string
  careersUrl: string
  reason: string
}

// Pure function: builds the LLM prompt for company discovery.
// Lives in the domain because prompt engineering is business logic —
// it encodes what "good company discovery" means.
export function buildDiscoveryPrompt(userPrompt: string): string {
  return [
    'You are a company research assistant.',
    'Based on the job search criteria below, return a JSON array of relevant companies.',
    '',
    `Criteria: ${userPrompt}`,
    '',
    'Return a JSON array with this exact shape:',
    '[{ "name": "string", "careersUrl": "string", "reason": "string" }]',
    '',
    'Rules:',
    '- careersUrl must be the real careers page URL of the company',
    '- reason must explain why this company matches the criteria in one sentence',
    '- return only the JSON array, no other text',
  ].join('\n')
}

// Pure function: parses and validates the raw LLM response.
// Lives in the domain because interpreting LLM output is business logic,
// not infrastructure concern.
//
// Partial results are intentional: LLMs occasionally return mostly valid output
// with one or two malformed entries. Filtering and returning the valid subset is
// more useful than failing the entire response. parse_failed is only triggered
// when nothing usable can be extracted (invalid JSON or zero valid items).
export function parseDiscoveredCompanies(raw: string): DiscoveredCompany[] | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const companies = parsed.filter(isDiscoveredCompany)
    return companies.length > 0 ? companies : null
  } catch {
    return null
  }
}

function isDiscoveredCompany(value: unknown): value is DiscoveredCompany {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'careersUrl' in value &&
    'reason' in value &&
    typeof (value as DiscoveredCompany).name === 'string' &&
    typeof (value as DiscoveredCompany).careersUrl === 'string' &&
    typeof (value as DiscoveredCompany).reason === 'string'
  )
}
