# Application Tracker Output Contract

This document defines the minimum data captured for each application record.

## Domain Shape (Current)
```typescript
export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'rejected' | 'offer' | 'withdrawn'

export interface Application {
  id: ApplicationId
  userId: string
  jobId: JobId
  resumeId: ResumeId
  status: ApplicationStatus
  appliedAt: Date | null
  notes: string | null
}
```

## Minimum Required Fields
- `userId` (owner)
- `jobId` (link to job listing)
- `resumeId` (which resume was used)
- `status` (applied / interview / rejected / offer)
- `appliedAt` (nullable)

## Notes
- `status` currently supports: `saved`, `applied`, `interview`, `rejected`, `offer`, `withdrawn`.
- `no_response` requires a schema update (new enum value) before it can be stored. Until then, the API rejects it explicitly.
- `notes` is optional but useful for follow-up context.
