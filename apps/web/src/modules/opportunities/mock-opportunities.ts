import type { Opportunity } from './types'

export const mockedOpportunities: Opportunity[] = [
  {
    id: 'kometa-senior-frontend',
    companyName: 'Kometa Health',
    roleTitle: 'Senior Frontend Engineer',
    location: 'Berlin, Germany',
    matchPercentage: 94,
    matchReason: 'Strong React, product UI, and healthcare domain overlap.',
    sourceCompanyReason: 'Healthcare startup in Berlin with a small product engineering team.',
    applied: false,
  },
  {
    id: 'northline-product-engineer',
    companyName: 'Northline AI',
    roleTitle: 'Product Engineer',
    location: 'Remote, EU',
    matchPercentage: 86,
    matchReason: 'Matches your full-stack profile and early-stage startup preference.',
    sourceCompanyReason: 'AI tooling company hiring across European remote teams.',
    applied: false,
  },
  {
    id: 'luma-platform-frontend',
    companyName: 'Luma Care',
    roleTitle: 'Frontend Platform Engineer',
    location: 'Hamburg, Germany',
    matchPercentage: 72,
    matchReason: 'Relevant frontend work, but less direct product ownership.',
    sourceCompanyReason: 'Patient operations platform with an active engineering hiring page.',
    applied: true,
  },
]
