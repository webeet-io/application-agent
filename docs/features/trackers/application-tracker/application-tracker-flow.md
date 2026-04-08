# Application Tracker Flow

## High-Level Flow
1. User views a job listing.
2. User marks it as `applied` (creates an application record).
3. User can update status later: `interview`, `rejected`, or `offer`.
4. Updates persist in Supabase and feed learning insights.

## Data Relationships
- `Application` links `userId`, `jobId`, `resumeId`.
- `jobId` points to a normalized job listing.

## Outcome Updates
- Status updates are user-triggered (manual updates).
- `no_response` is planned but requires a schema migration; the API rejects it until then.
- Future option: prompt the user after a configured delay if no response is recorded.

## Empty or Missing Data
- `appliedAt` can be null if the user saves without applying.
- `notes` is optional.
