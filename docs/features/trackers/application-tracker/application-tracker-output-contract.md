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
- `status` (applied / interview / rejected / offer / no_response)
- `appliedAt` (nullable)

## Notes
- `status` currently supports: `saved`, `applied`, `interview`, `rejected`, `offer`, `withdrawn`.
- `no_response` is a UI-level state that can map to `rejected` or `saved` until the domain adds it.
- `notes` is optional but useful for follow-up context.
