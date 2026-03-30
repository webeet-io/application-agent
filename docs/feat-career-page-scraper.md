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

## Deliverables (Docs First)
- Output contract for `CareerPageScraperPort`
- Scraper flow and decision tree (ATS vs unknown)
- Error handling guidance
- Test plan

## Not in Scope (for now)
- Auto-apply
- Company enrichment beyond the provided career page
- Full UI integration
