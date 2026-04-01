# Career Page Scraper Error Handling

## Error Types
```typescript
export type CareerPageError =
  | { type: 'fetch_failed'; url: string; message: string }
  | { type: 'ats_not_supported'; atsProvider: string }
  | { type: 'parse_failed'; raw: string }
```

## Guidelines
- Use `fetch_failed` when the page cannot be retrieved (network errors, 4xx/5xx).
- Use `parse_failed` when HTML/JSON is retrieved but cannot be normalized.
- Use `ats_not_supported` only when a known provider is detected but no adapter exists.
- **Do not** treat an empty listing page as an error.

## Edge Cases
- Redirects: allow follow; report final URL on failure.
- Rate limits: surface as `fetch_failed` with status in the message.
- Partial parse: if some listings parse and others fail, return the successful ones.
