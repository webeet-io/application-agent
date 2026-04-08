import { buildDefaultMatchOutput } from './default-match-output'
import { careerProfileToResumeProfile } from './career-profile-to-resume-profile'
import { scoreResumeAgainstJob } from './score-resume-against-job'
import { careerProfileFixture, matchFixtures } from './fixtures'

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function getFixture(id: string) {
  const fixture = matchFixtures.find((entry) => entry.id === id)
  invariant(fixture, `Fixture "${id}" not found`)
  return fixture
}

function findAssessment(
  fixtureId: string,
  skill: string,
  result: ReturnType<typeof scoreResumeAgainstJob>,
) {
  const assessment = result.requirementAssessments.find(
    (entry) => entry.skill === skill,
  )

  invariant(
    assessment,
    `Expected assessment for "${skill}" in fixture "${fixtureId}"`,
  )

  return assessment
}

export function runMatchEngineSmokeTests(): void {
  const mappedResumeProfile = careerProfileToResumeProfile(careerProfileFixture)
  invariant(
    mappedResumeProfile.seniority === careerProfileFixture.seniority,
    'Expected CareerProfile seniority to map to ResumeProfile seniority',
  )
  invariant(
    mappedResumeProfile.skillEvidence.some((entry) => entry.skill === 'Docker'),
    'Expected CareerProfile user-input skills to be available for scoring',
  )

  const strongDirectMatch = getFixture('strong-direct-match')
  const strongDirectResult = scoreResumeAgainstJob(
    strongDirectMatch.resume,
    strongDirectMatch.job,
  )

  invariant(
    strongDirectResult.overallMatchLevel === 'strong' ||
      strongDirectResult.overallMatchLevel === 'promising',
    'Expected strong direct match fixture to produce a positive overall match level',
  )
  invariant(
    strongDirectResult.scoreBand === 'medium' || strongDirectResult.scoreBand === 'high',
    'Expected strong direct match fixture to produce a medium or high score band',
  )
  invariant(
    strongDirectResult.criticalGaps.length === 0,
    'Expected strong direct match fixture to avoid critical gaps',
  )
  invariant(
    strongDirectResult.learnableGaps.includes('Docker'),
    'Expected Docker to appear as a learnable gap in the strong direct match fixture',
  )

  const strongDirectOutput = buildDefaultMatchOutput(strongDirectResult)
  invariant(
    strongDirectOutput.displayTone === 'warning' ||
      strongDirectOutput.displayTone === 'success',
    'Expected default output to expose a frontend-friendly display tone',
  )
  invariant(
    strongDirectOutput.recommendedSkillsToLearn.some(
      (entry) => entry.skill === 'Docker',
    ),
    'Expected default output to expose Docker as a recommended skill to learn',
  )

  const transferableFixture = getFixture('transferable-typescript-readiness')
  const transferableResult = scoreResumeAgainstJob(
    transferableFixture.resume,
    transferableFixture.job,
  )
  const transferableTypeScriptAssessment = findAssessment(
    transferableFixture.id,
    'TypeScript',
    transferableResult,
  )

  invariant(
    transferableTypeScriptAssessment.matchQuality === 'transferable' ||
      transferableTypeScriptAssessment.matchQuality === 'inferable',
    'Expected JavaScript-only evidence to produce transferable or inferable TypeScript support',
  )
  invariant(
    transferableTypeScriptAssessment.matchQuality !== 'direct',
    'Expected JavaScript-only evidence to avoid a direct TypeScript match',
  )

  const blockedFixture = getFixture('blocked-by-critical-gap')
  const blockedResult = scoreResumeAgainstJob(blockedFixture.resume, blockedFixture.job)

  invariant(
    blockedResult.knockout.blocked,
    'Expected backend knockout fixture to be blocked',
  )
  invariant(
    blockedResult.overallMatchLevel === 'blocked',
    'Expected blocked fixture to return blocked overall match level',
  )
  invariant(
    blockedResult.scoreBand === 'low',
    'Expected blocked fixture to return a low score band',
  )
  invariant(
    blockedResult.criticalGaps.includes('Node.js') &&
      blockedResult.criticalGaps.includes('PostgreSQL'),
    'Expected backend knockout fixture to flag Node.js and PostgreSQL as critical gaps',
  )

  const presentationGapFixture = getFixture('presentation-gap')
  const presentationGapResult = scoreResumeAgainstJob(
    presentationGapFixture.resume,
    presentationGapFixture.job,
  )
  const dockerAssessment = findAssessment(
    presentationGapFixture.id,
    'Docker',
    presentationGapResult,
  )

  invariant(
    dockerAssessment.matchQuality === 'direct',
    'Expected Docker to be recognized as a direct match when explicitly listed',
  )
  invariant(
    dockerAssessment.evidenceStrength === 'skills_section',
    'Expected Docker evidence to remain marked as skills-section evidence',
  )
  invariant(
    presentationGapResult.resumeImprovementSuggestions.some((entry) =>
      entry.includes('Docker'),
    ),
    'Expected presentation gap fixture to recommend surfacing Docker through projects or work bullets',
  )

  const presentationGapOutput = buildDefaultMatchOutput(presentationGapResult)
  invariant(
    presentationGapOutput.weaknesses.some(
      (entry) => entry.label === 'Docker' && entry.type === 'presentation_gap',
    ),
    'Expected default output to expose Docker as a presentation gap',
  )
}
