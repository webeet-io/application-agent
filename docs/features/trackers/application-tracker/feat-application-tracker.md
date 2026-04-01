# Feature: Application Tracker

**Branch:** `feat-application-tracker`

## Goal
Track job applications and outcomes so the system can learn from past results and users do not lose context.

## Scope (MVP)
- Mark a job as applied
- Record outcome updates: interviewing, rejected, no_response, offer
- Store application history in Supabase

## Docs (Created First)
- `docs/features/trackers/application-tracker/application-tracker-output-contract.md`
- `docs/features/trackers/application-tracker/application-tracker-flow.md`
- `docs/features/trackers/application-tracker/application-tracker-errors.md`
- `docs/features/trackers/application-tracker/application-tracker-ux-notes.md`
- `docs/features/trackers/application-tracker/application-tracker-test-plan.md`

## Implementation Status
- `SupabaseApplicationRepositoryAdapter` implemented
- Use cases added:
  - `MarkApplicationAppliedUseCase`
  - `UpdateApplicationStatusUseCase`
- Routes added:
  - `POST /api/applications/apply`
  - `PATCH /api/applications/{id}/status`
- DI container wired for application tracker use cases

## Not in Scope (for now)
- Auto-apply
- Team / multi-user workflows
- Analytics dashboards
