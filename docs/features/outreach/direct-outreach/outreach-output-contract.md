# Direct Outreach Output Contract

This document defines the normalized data contracts for contact discovery, validation, drafting, and tracking.

## Contact Discovery (Port)
```typescript
type ContactRole = 'vp_engineering' | 'engineering_manager' | 'team_lead' | 'hiring_manager' | 'other'

type ContactDiscoveryError =
  | { type: 'provider_unavailable'; message: string }
  | { type: 'not_found'; company: string }
  | { type: 'provider_error'; message: string }

type DiscoveredContact = {
  name: string
  role: ContactRole
  title: string
  email?: string
  source: string
  confidence: number
}

interface IContactDiscoveryPort {
  discover(companyName: string, companyDomain?: string): Promise<AttemptResult<ContactDiscoveryError, DiscoveredContact[]>>
}
```

## Email Validation (Port)
```typescript
type EmailValidationStatus = 'valid' | 'invalid' | 'risky' | 'unknown'

type EmailValidationError =
  | { type: 'provider_unavailable'; message: string }
  | { type: 'provider_error'; message: string }

type EmailValidationResult = {
  email: string
  status: EmailValidationStatus
  confidence: number
}

interface IEmailValidationPort {
  validate(email: string): Promise<AttemptResult<EmailValidationError, EmailValidationResult>>
}
```

## Email Drafting (Port)
```typescript
type DraftOutreachInput = {
  jobTitle: string
  jobDescription: string
  companyName: string
  companyContext?: string
  resumeHighlights: string
  contactName: string
  contactTitle: string
}

type DraftOutreachError =
  | { type: 'llm_failed'; message: string }

type DraftOutreachResult = {
  subject: string
  body: string
}

interface IEmailDraftPort {
  draft(input: DraftOutreachInput): Promise<AttemptResult<DraftOutreachError, DraftOutreachResult>>
}
```

## Outreach Tracking (Data Model)
```typescript
type OutreachStatus = 'drafted' | 'sent' | 'follow_up_due'

type OutreachLog = {
  id: string
  applicationId: string
  contactName: string
  contactEmail: string
  status: OutreachStatus
  draftedAt: Date
  sentAt?: Date
  notes?: string
}
```

## Notes
- CeeVee never sends emails. Users send manually.
- Only validated emails with high confidence are shown to the user.
- This feature is provider-agnostic by design.
