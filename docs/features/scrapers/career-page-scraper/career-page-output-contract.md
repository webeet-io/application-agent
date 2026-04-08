# Career Page Output Contract

This document defines the normalized output for `ICareerPagePort`.

## Port Signature (Current)
```typescript
export type JobListing = {
  title: string
  location: string
  url: string
  description: string
}

export type CareerPageResult = {
  jobs: JobListing[]
  atsProvider: ATSProvider
}

export type CareerPageError =
  | { type: 'fetch_failed'; url: string; message: string }
  | { type: 'ats_not_supported'; atsProvider: string }
  | { type: 'parse_failed'; raw: string }

export interface ICareerPagePort {
  fetchJobs(url: string, provider?: ATSProvider): Promise<AttemptResult<CareerPageError, CareerPageResult>>
}
```

## Minimum Required Fields
Each `JobListing` must include:
- `title`
- `description`
- `location`
- `url` (direct apply URL)

## Notes
- An empty `jobs` array is a valid success response when a page has no active listings.
- `atsProvider` should be set to the detected provider or `unknown`.
- If `provider` is passed, the adapter should honor it and skip detection.
- Normalize `location` to a plain string. Do not attempt geo-resolution in this layer.
