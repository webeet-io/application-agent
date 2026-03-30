# Career Page Scraper Flow

## High-Level Decision Tree
1. Input: `careerPageUrl` and optional `provider`.
2. If `provider` is provided, use it directly.
3. Otherwise, detect ATS provider by URL patterns and page hints.
4. If provider is supported, route to ATS-specific adapter.
5. If provider is unknown, use the generic HTML scraper.
6. Normalize output to `JobListing[]` and return with `atsProvider`.

## ATS-Specific Adapters (Examples)
- Greenhouse adapter
- Lever adapter
- Workday adapter

## Generic Scraper (Fallback)
- Fetch HTML
- Extract listing blocks via common selectors (e.g., `job`, `opening`, `position`)
- Follow per-listing links if details are on separate pages
- Normalize output to `JobListing`

## Empty or Missing Listings
- If the page loads but no listings are found, return `success` with an empty array.
- Only return errors for fetch/parse failures, not for empty pages.

## Observability
- Log provider selection and fallback decisions.
- Include `atsProvider` in the result for traceability.
