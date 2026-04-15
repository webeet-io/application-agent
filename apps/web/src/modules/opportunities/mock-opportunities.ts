import type { Opportunity } from './types'

export const mockedOpportunities: Opportunity[] = [
  {
    id: 'doctolib-connect-senior-frontend',
    companyName: 'Doctolib Connect',
    roleTitle: 'Senior Frontend Engineer',
    location: 'Berlin, Germany',
    matchPercentage: 94,
    matchReason: 'Strong React, product UI, and healthcare domain overlap.',
    sourceCompanyReason: 'Healthcare startup in Berlin with a small product engineering team.',
    applyUrl: 'https://connect.doctolib.com/careers',
    applied: false,
  },
  {
    id: 'mistral-product-engineer',
    companyName: 'Mistral AI',
    roleTitle: 'Product Engineer',
    location: 'Paris, France',
    matchPercentage: 86,
    matchReason: 'Matches your full-stack profile and early-stage startup preference.',
    sourceCompanyReason: 'AI tooling company hiring across European remote teams.',
    applyUrl: 'https://mistral.ai/careers/',
    applied: false,
  },
  {
    id: 'ada-health-platform-frontend',
    companyName: 'Ada Health',
    roleTitle: 'Frontend Platform Engineer',
    location: 'Berlin, Germany',
    matchPercentage: 72,
    matchReason: 'Relevant frontend work, but less direct product ownership.',
    sourceCompanyReason: 'Patient operations platform with an active engineering hiring page.',
    applyUrl: 'https://about.ada.com/careers',
    applied: true,
  },
]
