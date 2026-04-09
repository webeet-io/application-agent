import { describe, expect, it } from 'vitest'

import { buildCombinedResumeMatchResult } from './combined-match-result'
import { buildDefaultMatchOutput } from './default-match-output'
import { careerProfileToResumeProfile } from './career-profile-to-resume-profile'
import { aiMatchFixture, careerProfileFixture, matchFixtures } from './fixtures'
import { scoreResumeAgainstJob } from './score-resume-against-job'

function getFixture(id: string) {
  const fixture = matchFixtures.find((entry) => entry.id === id)

  if (!fixture) {
    throw new Error(`Fixture "${id}" not found`)
  }

  return fixture
}

function findAssessment(
  skill: string,
  result: ReturnType<typeof scoreResumeAgainstJob>,
) {
  const assessment = result.requirementAssessments.find(
    (entry) => entry.skill === skill,
  )

  if (!assessment) {
    throw new Error(`Expected assessment for "${skill}"`)
  }

  return assessment
}

describe('careerProfileToResumeProfile', () => {
  it('maps CareerProfile fields into the scoring-specific ResumeProfile', () => {
    const mappedResumeProfile = careerProfileToResumeProfile(careerProfileFixture)

    expect(mappedResumeProfile.seniority).toBe(careerProfileFixture.seniority)
    expect(mappedResumeProfile.skillEvidence.some((entry) => entry.skill === 'Docker')).toBe(true)
  })
})

describe('scoreResumeAgainstJob', () => {
  it('returns a positive match for the strong direct match fixture', () => {
    const fixture = getFixture('strong-direct-match')
    const result = scoreResumeAgainstJob(fixture.resume, fixture.job)
    const output = buildDefaultMatchOutput(result)

    expect(['strong', 'promising']).toContain(result.overallMatchLevel)
    expect(['medium', 'high']).toContain(result.scoreBand)
    expect(result.criticalGaps).toHaveLength(0)
    expect(result.learnableGaps).toContain('Docker')
    expect(['warning', 'success']).toContain(output.displayTone)
    expect(output.recommendedSkillsToLearn).toContainEqual(
      expect.objectContaining({ skill: 'Docker' }),
    )
    expect(output.recommendedImprovements).toHaveLength(0)
  })

  it('combines fallback and AI results into a frontend-friendly output', () => {
    const fixture = getFixture('strong-direct-match')
    const fallbackResult = scoreResumeAgainstJob(fixture.resume, fixture.job)
    const fallbackOutput = buildDefaultMatchOutput(fallbackResult)
    const combinedResult = buildCombinedResumeMatchResult(
      fallbackResult,
      fallbackOutput,
      aiMatchFixture,
    )

    expect(combinedResult.comparison.scoreDifference).toBeGreaterThan(0)
    expect(combinedResult.combinedOutput.strengths.length).toBeGreaterThanOrEqual(
      fallbackOutput.strengths.length,
    )
    expect(combinedResult.combinedOutput.recommendedSkillsToLearn).toContainEqual(
      expect.objectContaining({ skill: 'Docker' }),
    )
  })

  it('treats JavaScript-only evidence as transferable or inferable for TypeScript', () => {
    const fixture = getFixture('transferable-typescript-readiness')
    const result = scoreResumeAgainstJob(fixture.resume, fixture.job)
    const typeScriptAssessment = findAssessment('TypeScript', result)

    expect(['transferable', 'inferable']).toContain(typeScriptAssessment.matchQuality)
    expect(typeScriptAssessment.matchQuality).not.toBe('direct')
  })

  it('blocks backend roles when critical backend requirements are missing', () => {
    const fixture = getFixture('blocked-by-critical-gap')
    const result = scoreResumeAgainstJob(fixture.resume, fixture.job)

    expect(result.knockout.blocked).toBe(true)
    expect(result.overallMatchLevel).toBe('blocked')
    expect(result.scoreBand).toBe('low')
    expect(result.criticalGaps).toEqual(
      expect.arrayContaining(['Node.js', 'PostgreSQL']),
    )
  })

  it('surfaces presentation gaps when evidence only comes from a skills section', () => {
    const fixture = getFixture('presentation-gap')
    const result = scoreResumeAgainstJob(fixture.resume, fixture.job)
    const dockerAssessment = findAssessment('Docker', result)
    const output = buildDefaultMatchOutput(result)

    expect(dockerAssessment.matchQuality).toBe('direct')
    expect(dockerAssessment.evidenceStrength).toBe('skills_section')
    expect(result.resumeImprovementSuggestions).toContain(
      'Show Docker in project or work bullets, not only in a skills list',
    )
    expect(output.weaknesses).toContainEqual(
      expect.objectContaining({
        label: 'Docker',
        type: 'presentation_gap',
      }),
    )
  })
})
