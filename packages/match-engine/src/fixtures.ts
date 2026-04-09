import type {
  AiResumeMatchResult,
  CareerProfile,
  NormalizedJobPosting,
  ResumeProfile,
} from '@ceevee/types'

export interface MatchFixture {
  id: string
  description: string
  resume: ResumeProfile
  job: NormalizedJobPosting
}

export const careerProfileFixture: CareerProfile = {
  userId: 'fixture-user',
  label: 'Career profile from resume and user input',
  seniority: 'junior',
  languages: ['English', 'German'],
  preferences: {
    targetRoles: ['Frontend Engineer', 'Full-stack Engineer'],
    locations: ['Berlin'],
    remotePreference: 'hybrid',
  },
  skillEvidence: [
    {
      skill: 'TypeScript',
      source: 'work_experience',
      evidenceText: 'Built internal dashboards in TypeScript for 18 months.',
      strength: 'work_experience',
      depth: 'work_usage',
      yearsOfExperience: 1.5,
      confidence: 0.9,
      visibleOnResume: true,
    },
    {
      skill: 'React',
      source: 'project',
      evidenceText: 'Shipped multiple React projects for client portals.',
      strength: 'project',
      depth: 'multiple_projects',
      yearsOfExperience: 1,
      confidence: 0.85,
      visibleOnResume: true,
    },
    {
      skill: 'Docker',
      source: 'user_input',
      evidenceText: 'Used Docker locally for development, but not yet shown in resume projects.',
      strength: 'skills_section',
      depth: 'small_project',
      confidence: 0.55,
      visibleOnResume: false,
    },
  ],
  workExperience: [
    {
      title: 'Frontend Developer Intern',
      company: 'Example GmbH',
      summary: 'Built internal dashboards and maintained frontend components.',
      skills: ['TypeScript', 'React'],
    },
  ],
  projects: [
    {
      name: 'Client portal prototype',
      summary: 'Built a React portal prototype with API integration.',
      skills: ['React', 'REST APIs'],
    },
  ],
}

export const aiMatchFixture: AiResumeMatchResult = {
  overallScore: 76,
  overallMatchLevel: 'promising',
  confidence: 0.82,
  strengths: [
    {
      label: 'TypeScript',
      description: 'AI sees clear alignment between production TypeScript work and the role.',
      priority: 'core',
    },
    {
      label: 'React',
      description: 'AI sees React project evidence as strongly relevant for frontend delivery.',
      priority: 'core',
    },
  ],
  weaknesses: [
    {
      label: 'Docker',
      description: 'Docker is not yet strongly evidenced for this role.',
      priority: 'nice_to_have',
      severity: 'low',
      type: 'learnable_gap',
    },
  ],
  shortSummary:
    'The candidate appears to be a promising fit with strong frontend alignment and one learnable infrastructure gap.',
  recommendedImprovements: [
    'Make infrastructure experience more visible in project bullets.',
  ],
  recommendedSkillsToLearn: [
    {
      skill: 'Docker',
      reason: 'Docker would improve readiness for day-to-day development workflows.',
      priority: 'medium',
    },
  ],
}

export const matchFixtures: MatchFixture[] = [
  {
    id: 'strong-direct-match',
    description:
      'Junior frontend candidate with direct TypeScript and React evidence for a junior frontend role.',
    resume: {
      label: 'Frontend CV',
      seniority: 'junior',
      languages: ['English', 'German'],
      locations: ['Berlin'],
      skillEvidence: [
        {
          skill: 'TypeScript',
          source: 'work_experience',
          summary: 'Built internal dashboards in TypeScript for 18 months.',
          strength: 'work_experience',
          depth: 'work_usage',
          yearsOfExperience: 1.5,
        },
        {
          skill: 'React',
          source: 'project',
          summary: 'Shipped multiple React projects for client portals.',
          strength: 'project',
          depth: 'multiple_projects',
          yearsOfExperience: 1,
        },
        {
          skill: 'REST APIs',
          aliases: ['REST'],
          source: 'project',
          summary: 'Integrated REST APIs in side projects and internships.',
          strength: 'project',
          depth: 'multiple_projects',
        },
        {
          skill: 'JavaScript',
          source: 'work_experience',
          summary: 'Used JavaScript daily before migrating to TypeScript.',
          strength: 'work_experience',
          depth: 'work_usage',
          yearsOfExperience: 2,
        },
      ],
    },
    job: {
      title: 'Junior Frontend Engineer',
      requiredLanguages: ['English'],
      locationConstraint: {
        mode: 'hybrid',
        allowedLocations: ['Berlin'],
      },
      seniority: 'junior',
      requirements: [
        {
          id: 'typescript-core',
          skill: 'TypeScript',
          priority: 'core',
          isKnockout: true,
          learnability: 'moderate',
        },
        {
          id: 'react-core',
          skill: 'React',
          priority: 'core',
          learnability: 'moderate',
        },
        {
          id: 'api-supporting',
          skill: 'REST APIs',
          priority: 'supporting',
          alternatives: ['REST'],
          learnability: 'fast',
        },
        {
          id: 'docker-nice',
          skill: 'Docker',
          priority: 'nice_to_have',
          learnability: 'fast',
        },
      ],
    },
  },
  {
    id: 'transferable-typescript-readiness',
    description:
      'JavaScript-heavy candidate for a TypeScript role should get transferable or inferable support, not a full direct match.',
    resume: {
      label: 'JavaScript CV',
      seniority: 'junior',
      languages: ['English'],
      locations: ['Remote'],
      skillEvidence: [
        {
          skill: 'JavaScript',
          relatedSkills: ['TypeScript'],
          source: 'work_experience',
          summary: 'Worked on JavaScript SPAs in production for 2 years.',
          strength: 'work_experience',
          depth: 'work_usage',
          yearsOfExperience: 2,
        },
        {
          skill: 'React',
          source: 'work_experience',
          summary: 'Maintained a React customer portal for an e-commerce team.',
          strength: 'work_experience',
          depth: 'work_usage',
          yearsOfExperience: 1.5,
        },
      ],
    },
    job: {
      title: 'Junior TypeScript Developer',
      requiredLanguages: ['English'],
      locationConstraint: {
        mode: 'remote',
      },
      seniority: 'junior',
      requirements: [
        {
          id: 'typescript-core',
          skill: 'TypeScript',
          priority: 'core',
          relatedSkills: ['JavaScript'],
          inferableFromSkills: ['JavaScript'],
          learnability: 'moderate',
        },
        {
          id: 'react-supporting',
          skill: 'React',
          priority: 'supporting',
          learnability: 'fast',
        },
      ],
    },
  },
  {
    id: 'blocked-by-critical-gap',
    description:
      'Frontend candidate without backend fundamentals should be blocked for a backend role with knockout technology requirements.',
    resume: {
      label: 'Frontend-only CV',
      seniority: 'junior',
      languages: ['English'],
      locations: ['Berlin'],
      skillEvidence: [
        {
          skill: 'React',
          source: 'work_experience',
          summary: 'Built and maintained B2B React applications.',
          strength: 'work_experience',
          depth: 'work_usage',
          yearsOfExperience: 2,
        },
        {
          skill: 'TypeScript',
          source: 'project',
          summary: 'Used TypeScript in side projects and an internship.',
          strength: 'project',
          depth: 'multiple_projects',
          yearsOfExperience: 1,
        },
      ],
    },
    job: {
      title: 'Mid Backend Engineer',
      requiredLanguages: ['English'],
      locationConstraint: {
        mode: 'onsite',
        allowedLocations: ['Munich'],
      },
      seniority: 'mid',
      requirements: [
        {
          id: 'node-core',
          skill: 'Node.js',
          priority: 'core',
          isKnockout: true,
          learnability: 'structural',
        },
        {
          id: 'postgres-core',
          skill: 'PostgreSQL',
          priority: 'core',
          isKnockout: true,
          learnability: 'structural',
        },
        {
          id: 'docker-supporting',
          skill: 'Docker',
          priority: 'supporting',
          learnability: 'fast',
        },
      ],
    },
  },
  {
    id: 'presentation-gap',
    description:
      'Candidate has the right skill but only lists it in a skills section, which should lower confidence and trigger resume improvement suggestions.',
    resume: {
      label: 'Thin CV',
      seniority: 'junior',
      languages: ['English'],
      locations: ['Hamburg'],
      skillEvidence: [
        {
          skill: 'Docker',
          source: 'skills_section',
          summary: 'Lists Docker among technical skills without project evidence.',
          strength: 'skills_section',
          depth: 'theory',
        },
        {
          skill: 'Linux',
          source: 'project',
          summary: 'Used Linux in personal server and deployment experiments.',
          strength: 'project',
          depth: 'small_project',
        },
      ],
    },
    job: {
      title: 'Junior Platform Engineer',
      requiredLanguages: ['English'],
      locationConstraint: {
        mode: 'remote',
      },
      seniority: 'junior',
      requirements: [
        {
          id: 'docker-core',
          skill: 'Docker',
          priority: 'core',
          learnability: 'fast',
        },
        {
          id: 'kubernetes-nice',
          skill: 'Kubernetes',
          priority: 'nice_to_have',
          learnability: 'moderate',
        },
      ],
    },
  },
]
