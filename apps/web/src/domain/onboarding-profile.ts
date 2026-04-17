import type {
  CareerProfile,
  CareerProfileSkillEvidence,
  EvidenceStrength,
  ExperienceDepth,
  OnboardingChatMessage,
  OnboardingSession,
  SeniorityLevel,
} from '@ceevee/types'

export interface OnboardingCompletionSignal {
  id: 'resume_context' | 'user_answers' | 'skill_clues' | 'career_direction'
  label: string
  met: boolean
  detail: string
}

export interface OnboardingCompletionPreview {
  completenessScore: number
  isReadyForCompletion: boolean
  draft: CareerProfile
  signals: OnboardingCompletionSignal[]
  summary: string
}

interface ExtractedSkillCandidate {
  skill: string
  evidenceText: string
  source: CareerProfileSkillEvidence['source']
  strength: EvidenceStrength
  depth: ExperienceDepth
  confidence: number
  visibleOnResume: boolean
}

const LANGUAGE_PATTERNS = [
  { label: 'English', pattern: /\benglish\b/i },
  { label: 'German', pattern: /\b(german|deutsch)\b/i },
  { label: 'French', pattern: /\b(french|francais)\b/i },
  { label: 'Spanish', pattern: /\b(spanish|espanol)\b/i },
  { label: 'Italian', pattern: /\bitalian\b/i },
  { label: 'Dutch', pattern: /\bdutch\b/i },
  { label: 'Portuguese', pattern: /\bportuguese\b/i },
]

const TARGET_ROLE_PATTERNS = [
  /(?:aiming for|looking for|target(?:ing)?|interested in|want to work as|next role(?: is)?|role I want next is)\s+([^.,;\n]+)/i,
]

const SKILL_PATTERNS: Array<{ skill: string; pattern: RegExp }> = [
  { skill: 'TypeScript', pattern: /\btypescript\b/i },
  { skill: 'JavaScript', pattern: /\bjavascript\b/i },
  { skill: 'React', pattern: /\breact\b/i },
  { skill: 'Next.js', pattern: /\bnext(?:\.js)?\b/i },
  { skill: 'Node.js', pattern: /\bnode(?:\.js)?\b/i },
  { skill: 'Vue', pattern: /\bvue\b/i },
  { skill: 'Angular', pattern: /\bangular\b/i },
  { skill: 'Python', pattern: /\bpython\b/i },
  { skill: 'Java', pattern: /\bjava\b/i },
  { skill: 'C#', pattern: /\bc#\b/i },
  { skill: 'SQL', pattern: /\bsql\b/i },
  { skill: 'PostgreSQL', pattern: /\bpostgres(?:ql)?\b/i },
  { skill: 'REST APIs', pattern: /\brest(?:ful)? api|rest apis?\b/i },
  { skill: 'GraphQL', pattern: /\bgraphql\b/i },
  { skill: 'Docker', pattern: /\bdocker\b/i },
  { skill: 'Kubernetes', pattern: /\bkubernetes\b/i },
  { skill: 'AWS', pattern: /\baws\b|\bamazon web services\b/i },
  { skill: 'Figma', pattern: /\bfigma\b/i },
]

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function splitIntoSnippets(value: string): string[] {
  return value
    .split(/[\n\r]+|(?<=[.!?])\s+/)
    .map((snippet) => normalizeWhitespace(snippet))
    .filter((snippet) => snippet.length > 0)
}

function firstMatch(value: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = value.match(pattern)
    if (match?.[1]) {
      return normalizeWhitespace(match[1])
    }
  }

  return null
}

function deriveSeniority(text: string): SeniorityLevel {
  if (/\b(staff|principal)\b/i.test(text)) return 'staff'
  if (/\b(lead|team lead|engineering manager)\b/i.test(text)) return 'lead'
  if (/\bsenior\b/i.test(text)) return 'senior'
  if (/\b(intern|internship|working student)\b/i.test(text)) return 'intern'
  if (/\b(junior|entry[- ]level|entry level)\b/i.test(text)) return 'junior'
  return 'mid'
}

function detectLanguages(text: string): string[] {
  return LANGUAGE_PATTERNS.filter((entry) => entry.pattern.test(text)).map((entry) => entry.label)
}

function deriveStrength(snippet: string): EvidenceStrength {
  if (/\b(achieved|improved|increased|reduced|delivered|shipped)\b/i.test(snippet)) {
    return 'explicit_achievement'
  }

  if (/\b(worked|used|built|maintained|implemented|supported|company|client|production|job)\b/i.test(snippet)) {
    return 'work_experience'
  }

  if (/\b(project|portfolio|prototype|side project|capstone)\b/i.test(snippet)) {
    return 'project'
  }

  if (/\b(university|degree|course|bootcamp|study|studied)\b/i.test(snippet)) {
    return 'education'
  }

  return 'skills_section'
}

function deriveDepth(snippet: string): ExperienceDepth {
  if (/\b(owned|owner|responsible|led|mentored|managed)\b/i.test(snippet)) {
    return 'ownership'
  }

  if (/\b(production|client|company|internship|job|daily|work)\b/i.test(snippet)) {
    return 'work_usage'
  }

  if (/\b(multiple projects|several projects|many projects)\b/i.test(snippet)) {
    return 'multiple_projects'
  }

  if (/\b(project|portfolio|prototype|capstone)\b/i.test(snippet)) {
    return 'small_project'
  }

  return 'theory'
}

function deriveConfidence(strength: EvidenceStrength, depth: ExperienceDepth): number {
  let score = 0.5

  if (strength === 'explicit_achievement') score += 0.18
  if (strength === 'work_experience') score += 0.14
  if (strength === 'project') score += 0.08
  if (strength === 'education') score += 0.04

  if (depth === 'ownership') score += 0.15
  if (depth === 'work_usage') score += 0.12
  if (depth === 'multiple_projects') score += 0.08
  if (depth === 'small_project') score += 0.04

  return Math.min(0.96, Number(score.toFixed(2)))
}

function collectSkillCandidates(input: {
  text: string
  source: CareerProfileSkillEvidence['source']
  visibleOnResume: boolean
}): ExtractedSkillCandidate[] {
  const snippets = splitIntoSnippets(input.text)

  return SKILL_PATTERNS.flatMap((entry) => {
    const matchingSnippet = snippets.find((snippet) => entry.pattern.test(snippet))
    if (!matchingSnippet) {
      return []
    }

    const strength = deriveStrength(matchingSnippet)
    const depth = deriveDepth(matchingSnippet)

    return [
      {
        skill: entry.skill,
        evidenceText: matchingSnippet,
        source: input.source,
        strength,
        depth,
        confidence: deriveConfidence(strength, depth),
        visibleOnResume: input.visibleOnResume,
      },
    ]
  })
}

function mergeSkillCandidates(
  candidates: ExtractedSkillCandidate[],
): CareerProfile['skillEvidence'] {
  const bySkill = new Map<string, ExtractedSkillCandidate>()

  for (const candidate of candidates) {
    const existing = bySkill.get(candidate.skill)
    if (!existing || candidate.confidence > existing.confidence) {
      bySkill.set(candidate.skill, candidate)
    }
  }

  return Array.from(bySkill.values()).map((candidate) => ({
    skill: candidate.skill,
    source: candidate.source,
    evidenceText: candidate.evidenceText,
    strength: candidate.strength,
    depth: candidate.depth,
    confidence: candidate.confidence,
    visibleOnResume: candidate.visibleOnResume,
  }))
}

function buildAdditionalNotes(input: {
  hasResumeUpload: boolean
  hasResumeText: boolean
  userMessages: OnboardingChatMessage[]
}): string | undefined {
  const transcript = input.userMessages
    .map((message) => normalizeWhitespace(message.content))
    .filter((message) => message.length > 0)
    .join('\n')

  const sections = [
    input.hasResumeUpload ? 'Resume uploaded during onboarding.' : 'No resume uploaded during onboarding.',
    input.hasResumeText ? 'Resume text was parsed and attached to the session.' : 'Resume text parsing is not attached yet.',
    transcript ? `User-provided onboarding notes:\n${transcript}` : null,
  ].filter((section): section is string => Boolean(section))

  const combined = sections.join('\n\n').trim()
  return combined.length > 0 ? combined.slice(0, 2200) : undefined
}

function buildSummary(input: {
  completenessScore: number
  skillCount: number
  userMessageCount: number
  hasResumeUpload: boolean
  targetRoles: string[]
}): string {
  const parts = [
    input.hasResumeUpload ? 'resume attached' : 'no resume attached',
    `${String(input.userMessageCount)} user answers saved`,
    `${String(input.skillCount)} skill clue${input.skillCount === 1 ? '' : 's'} detected`,
    input.targetRoles.length > 0 ? `target role hints: ${input.targetRoles.join(', ')}` : 'target role still needs clarification',
  ]

  return `Onboarding readiness is ${String(input.completenessScore)}%. Current signal: ${parts.join(', ')}.`
}

export function buildOnboardingCompletionPreview(input: {
  userId: string
  session: OnboardingSession
  messages: OnboardingChatMessage[]
}): OnboardingCompletionPreview {
  const userMessages = input.messages.filter((message) => message.role === 'user')
  const userTranscript = userMessages.map((message) => message.content).join('\n')
  const resumeText = input.session.resumeText ?? ''
  const combinedText = `${resumeText}\n${userTranscript}`.trim()
  const hasResumeUpload = input.session.resumeId !== null
  const hasResumeText = resumeText.trim().length > 0
  const targetRoleCandidate = firstMatch(combinedText, TARGET_ROLE_PATTERNS)
  const targetRoles = targetRoleCandidate ? [targetRoleCandidate] : []
  const languages = detectLanguages(combinedText)
  const skillEvidence = mergeSkillCandidates([
    ...collectSkillCandidates({
      text: resumeText,
      source: 'resume',
      visibleOnResume: true,
    }),
    ...collectSkillCandidates({
      text: userTranscript,
      source: 'user_input',
      visibleOnResume: false,
    }),
  ])

  const transcriptLength = normalizeWhitespace(userTranscript).length

  let completenessScore = 0
  if (hasResumeUpload) completenessScore += 20
  if (hasResumeText) completenessScore += 10
  if (userMessages.length >= 1) completenessScore += 15
  if (userMessages.length >= 3) completenessScore += 15
  if (transcriptLength >= 240) completenessScore += 10
  if (transcriptLength >= 600) completenessScore += 10
  if (skillEvidence.length >= 1) completenessScore += 10
  if (skillEvidence.length >= 3) completenessScore += 5
  if (targetRoles.length > 0) completenessScore += 5

  completenessScore = Math.min(100, completenessScore)

  const signals: OnboardingCompletionSignal[] = [
    {
      id: 'resume_context',
      label: 'Resume context',
      met: hasResumeUpload || hasResumeText,
      detail: hasResumeText
        ? 'A resume and text context are attached to the onboarding session.'
        : hasResumeUpload
          ? 'A resume file is attached, even though parsed text is not available yet.'
          : 'The user skipped resume context for now.',
    },
    {
      id: 'user_answers',
      label: 'User answers',
      met: userMessages.length >= 2,
      detail:
        userMessages.length > 0
          ? `${String(userMessages.length)} user answers are already persisted in onboarding chat.`
          : 'No user answers have been saved yet.',
    },
    {
      id: 'skill_clues',
      label: 'Skill clues',
      met: skillEvidence.length >= 1,
      detail:
        skillEvidence.length > 0
          ? `${String(skillEvidence.length)} potential skills were inferred from resume or onboarding text.`
          : 'No concrete skills could be inferred yet from the saved context.',
    },
    {
      id: 'career_direction',
      label: 'Career direction',
      met: targetRoles.length > 0,
      detail:
        targetRoles.length > 0
          ? `Potential target role: ${targetRoles.join(', ')}.`
          : 'A clear target role is not visible yet from the saved answers.',
    },
  ]

  const draft: CareerProfile = {
    userId: input.userId,
    label: 'Onboarding career profile',
    seniority: deriveSeniority(combinedText),
    languages,
    preferences:
      targetRoles.length > 0
        ? {
            targetRoles,
          }
        : undefined,
    skillEvidence,
    additionalNotes: buildAdditionalNotes({
      hasResumeUpload,
      hasResumeText,
      userMessages,
    }),
  }

  return {
    completenessScore,
    isReadyForCompletion: completenessScore >= 55,
    draft,
    signals,
    summary: buildSummary({
      completenessScore,
      skillCount: skillEvidence.length,
      userMessageCount: userMessages.length,
      hasResumeUpload,
      targetRoles,
    }),
  }
}
