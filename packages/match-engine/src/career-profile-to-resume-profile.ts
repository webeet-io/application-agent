import type {
  CareerProfile,
  ResumeProfile,
  ResumeSkillEvidence,
} from '@ceevee/types'

function mapCareerSkillSourceToResumeSource(
  source: CareerProfile['skillEvidence'][number]['source'],
): ResumeSkillEvidence['source'] {
  switch (source) {
    case 'work_experience':
      return 'work_experience'
    case 'project':
      return 'project'
    case 'education':
      return 'education'
    case 'skills_section':
      return 'skills_section'
    case 'resume':
      return 'skills_section'
    case 'user_input':
      return 'skills_section'
  }
}

export function careerProfileToResumeProfile(
  careerProfile: CareerProfile,
): ResumeProfile {
  return {
    label: careerProfile.label,
    targetRoles: careerProfile.preferences?.targetRoles,
    seniority: careerProfile.seniority,
    languages: careerProfile.languages,
    locations: careerProfile.preferences?.locations,
    skillEvidence: careerProfile.skillEvidence.map((evidence) => ({
      skill: evidence.skill,
      aliases: evidence.aliases,
      relatedSkills: evidence.relatedSkills,
      source: mapCareerSkillSourceToResumeSource(evidence.source),
      summary: evidence.evidenceText,
      strength: evidence.strength,
      depth: evidence.depth,
      yearsOfExperience: evidence.yearsOfExperience,
    })),
  }
}
