# Feature: Direct Outreach

**Branch:** `feat-direct-outreach`

## Goal
Enable users to find key hiring contacts, validate email deliverability, draft a personalized outreach email, and log outreach alongside application status.

## Scope (MVP)
- Contact discovery (2-3 relevant contacts per company)
- Email validation (only high-confidence deliverability shown)
- Personalized email draft (user reviews and sends manually)
- Outreach tracking linked to application records

## Docs (Created First)
- `docs/features/outreach/direct-outreach/outreach-output-contract.md`
- `docs/features/outreach/direct-outreach/outreach-flow.md`
- `docs/features/outreach/direct-outreach/outreach-errors.md`
- `docs/features/outreach/direct-outreach/outreach-tracking.md`
- `docs/features/outreach/direct-outreach/outreach-ux-notes.md`
- `docs/features/outreach/direct-outreach/outreach-test-plan.md`
- `docs/features/outreach/direct-outreach/outreach-provider-notes.md`

## Implementation (Current)
### Ports
- `apps/web/src/ports/outbound/IContactDiscoveryPort.ts`
- `apps/web/src/ports/outbound/IEmailValidationPort.ts`
- `apps/web/src/ports/outbound/IEmailDraftPort.ts`
- `apps/web/src/ports/outbound/IOutreachRepositoryPort.ts`

### Adapters (Stubbed)
- `apps/web/src/adapters/outreach/ContactDiscoveryAdapter.ts`
- `apps/web/src/adapters/outreach/EmailValidationAdapter.ts`
- `apps/web/src/adapters/outreach/EmailDraftAdapter.ts`

Current behavior: all outreach adapters return `provider_unavailable` / `llm_failed` until a real provider is configured.

### Repository Adapter
- `apps/web/src/adapters/db/SupabaseOutreachRepositoryAdapter.ts`
  - Validates ownership against `applications` before inserting into `outreach_logs`.

### Use Cases
- `apps/web/src/application/DiscoverOutreachContactsUseCase.ts`
- `apps/web/src/application/ValidateOutreachEmailsUseCase.ts`
- `apps/web/src/application/DraftOutreachEmailUseCase.ts`
- `apps/web/src/application/LogOutreachUseCase.ts`

### API Routes (Auth Required)
- `apps/web/src/app/api/outreach/contacts/route.ts`
- `apps/web/src/app/api/outreach/validate/route.ts`
- `apps/web/src/app/api/outreach/draft/route.ts`
- `apps/web/src/app/api/outreach/log/route.ts`

### DI Wiring
- `apps/web/src/infrastructure/container.ts`

## Dependencies (Pending)
- Contact discovery provider (Apollo/Hunter/Clearbit)
- Email validation provider (ZeroBounce/NeverBounce)
- OpenAI API key for drafting

## Not Done / Pending
- Separate migration branch to add the `outreach_logs` table + RLS.
- Provider integrations + real API calls.
- Draft generation backed by an LLM.
- Tests not run.

## Not in Scope (for now)
- Automatic sending
- Mass outreach automation
- B2B email campaigns
