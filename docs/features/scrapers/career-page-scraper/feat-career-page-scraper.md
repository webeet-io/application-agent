# Feature: Career Page Job Listing Extraction

**Branch:** `feat-career-page-scraper`

## Goal
Provide a consistent, normalized list of job listings from any career page (ATS or custom), so downstream features do not need to care about source-specific formats.

## Scope (MVP)
- Input: career page URL (optionally with detected ATS provider)
- Output: normalized list of listings
- Minimum listing fields: title, description, location, apply URL
- Handle ATS-specific structures and unknown/custom pages
- Clear error handling for fetch/parse failures

## Docs (Created First)
- `docs/features/scrapers/career-page-scraper/career-page-output-contract.md`
- `docs/features/scrapers/career-page-scraper/career-page-scraper-flow.md`
- `docs/features/scrapers/career-page-scraper/career-page-scraper-errors.md`
- `docs/features/scrapers/career-page-scraper/career-page-scraper-test-plan.md`

## Implementation Status
- `ICareerPagePort` updated to accept optional provider
- `CareerPageAdapter` implemented with:
  - Greenhouse JSON endpoint
  - Lever JSON endpoint
  - JSON-LD fallback for unknown pages
- Use case added: `FetchCareerPageJobsUseCase`
- Route added: `POST /api/career-pages/scrape`

## Not in Scope (for now)
- Auto-apply
- Company enrichment beyond the provided career page
- Full UI integration
