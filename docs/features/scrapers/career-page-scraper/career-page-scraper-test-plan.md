# Career Page Scraper Test Plan

## Unit Tests
- Normalize listing shape from ATS adapter output.
- Handle missing fields (e.g., no location) gracefully.
- Verify empty listing array is treated as success.

## Adapter Tests (Mocked Fetch)
- Greenhouse: parse job list JSON to normalized output.
- Lever: parse postings JSON to normalized output.
- Workday: parse listings JSON to normalized output.

## Fallback Scraper Tests
- Simple HTML with known selectors.
- HTML with no listings (expect empty array).
- Broken HTML (expect `parse_failed`).

## Error Handling Tests
- 404/500 -> `fetch_failed`
- Unsupported provider -> `unsupported_provider`
- Rate limit -> `fetch_failed` with status 429

## Non-Goals (for now)
- End-to-end scraping against live sites (use fixtures instead)
