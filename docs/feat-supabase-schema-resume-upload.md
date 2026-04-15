# Feature: Supabase Schema + Resume Upload

**Branch:** `feat-supabase-schema-resume-upload`

## Goal
Initial implementation for Task1 and Task2:
- Supabase schema + pgvector groundwork
- Resume upload + storage baseline

## Implementation
### Supabase Schema (Migration)
Handled in a separate migration branch: `migration/initial-schema` (based on `main`).
That branch contains `supabase/migrations/202603250001_init.sql` and is intended to be
reviewed/merged independently. This feature branch intentionally does not include the
migration file.

The migration includes:
- Extensions: `pgcrypto`, `vector`
- Enums: `ats_provider`, `application_status`
- Tables:
  - `companies`
  - `job_listings`
  - `resumes`
  - `applications`
- Indexes for common queries
- RLS + Policies:
  - `resumes` & `applications` are owner-only
  - `companies` & `job_listings` readable for authenticated users
- Storage:
  - Bucket `resumes`
  - Storage policies for own objects

### Resume Upload (Backend)
New/updated components:
- Port: `apps/web/src/ports/outbound/IResumeStoragePort.ts`
- Adapter (Storage): `apps/web/src/adapters/storage/SupabaseResumeStorageAdapter.ts`
- Adapter (DB): `apps/web/src/adapters/db/SupabaseResumeRepositoryAdapter.ts`
- Use Case: `apps/web/src/application/UploadResumeUseCase.ts`
- API Route: `apps/web/src/app/api/resumes/upload/route.ts`
- DI Container Wiring: `apps/web/src/infrastructure/container.ts`

### Types
- `Resume` extended with optional metadata:
  - `storagePath`, `originalFileName`, `mimeType`, `sizeBytes`
File: `packages/types/src/index.ts`

## Assumptions / Notes
- Upload route uses the authenticated user from the server-side session.
- `fileUrl` currently stores the storage path (signed URLs can be generated later).

## Not Done
- Migration executed in Supabase
- Frontend UI for upload
