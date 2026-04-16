import type { LearningResourceRequest, LearningResourceRecommendation } from './mentor-skill-gap'

export function buildLearningResourcePrompt(input: LearningResourceRequest): string {
  const bucketLabel =
    input.bucket === 'now' ? 'immediately (this week)'
    : input.bucket === 'next' ? 'in the near term (next 1–4 weeks)'
    : 'later (strategic, lower urgency)'

  const strategyLabel =
    input.strategyMode === 'get_hired_quickly' ? 'get hired as quickly as possible — prioritise practical, portfolio-ready output'
    : input.strategyMode === 'long_term_growth' ? 'build deep, long-term expertise — prioritise thorough understanding over speed'
    : 'balance speed and depth — mix quick wins with solid foundations'

  const kindLabel =
    input.gapKind === 'hard_skill' ? 'a specific technical skill'
    : input.gapKind === 'signal' ? 'a professional signal or soft skill'
    : 'a type of real-world experience'

  return `You are a learning advisor for software engineers who are actively job hunting.

A user has a skill gap they need to close. Return 3 to 5 learning resource recommendations for it.

Gap details:
- Name: ${input.gapName}
- Kind: ${kindLabel}
- Learning objective: ${input.learningObjective}
- Time priority: ${bucketLabel}
- Strategy: ${strategyLabel}

Return ONLY a JSON array. No explanation, no markdown, no wrapper object. Each item must have:
- "title": string — name of the resource
- "type": one of "tutorial" | "course" | "documentation" | "project" | "exercise" | "article"
- "reason": string — one sentence explaining why this resource fits the gap and strategy
- "url": string or null — only include a URL if you are highly confident it is accurate and publicly accessible; use null otherwise

Example format:
[
  {
    "title": "The Official TypeScript Handbook",
    "type": "documentation",
    "reason": "Authoritative reference that covers the exact type system concepts needed for this gap.",
    "url": "https://www.typescriptlang.org/docs/handbook/intro.html"
  }
]`
}

export function parseLearningResourceRecommendations(raw: string): LearningResourceRecommendation[] | null {
  const trimmed = raw.trim()

  // Strip markdown code fences if present
  const unwrapped = trimmed.startsWith('```')
    ? trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    : trimmed

  let parsed: unknown
  try {
    parsed = JSON.parse(unwrapped)
  } catch {
    return null
  }

  if (!Array.isArray(parsed)) return null

  const VALID_TYPES = new Set(['tutorial', 'course', 'documentation', 'project', 'exercise', 'article'])

  const results: LearningResourceRecommendation[] = []
  for (const item of parsed) {
    if (!item || typeof item !== 'object') return null

    const { title, type, reason, url } = item as Record<string, unknown>

    if (typeof title !== 'string' || !title.trim()) return null
    if (typeof type !== 'string' || !VALID_TYPES.has(type)) return null
    if (typeof reason !== 'string' || !reason.trim()) return null
    if (url !== null && typeof url !== 'string') return null

    results.push({
      title: title.trim(),
      type: type as LearningResourceRecommendation['type'],
      reason: reason.trim(),
      url: typeof url === 'string' ? url.trim() : null,
    })
  }

  return results.length > 0 ? results : null
}
