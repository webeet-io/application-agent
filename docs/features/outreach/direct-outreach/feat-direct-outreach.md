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

## Dependencies (Pending)
- Contact discovery provider (Apollo/Hunter/Clearbit)
- Email validation provider (ZeroBounce/NeverBounce)
- OpenAI API key for drafting

## Not in Scope (for now)
- Automatic sending
- Mass outreach automation
- B2B email campaigns
