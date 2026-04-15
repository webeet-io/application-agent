import type { ATSProvider } from '@ceevee/types'

// How the provider was determined.
// 'url_pattern'  — matched against known ATS hostname patterns (MVP)
// 'html_marker'  — matched against page content markers (future, adapter-layer concern)
// 'fallback'     — no signal found or URL was unparseable
export type ATSDetectionMethod = 'url_pattern' | 'html_marker' | 'fallback'

// Typed result for ATS provider detection.
// Carries more than just the provider so callers can make informed decisions
// about how much to trust the result and log what evidence was used.
export type ATSDetectionResult = {
  provider: ATSProvider
  method: ATSDetectionMethod
  confidence: 'high' | 'medium' | 'low'
  evidence: string
}

type ProviderRule = {
  provider: ATSProvider
  match: (hostname: string) => boolean
  evidence: (hostname: string) => string
}

// Ordered from most specific to least specific.
// First match wins — no ambiguity between overlapping patterns.
const URL_RULES: ProviderRule[] = [
  {
    provider: 'greenhouse',
    match: (h) => h.includes('greenhouse.io'),
    evidence: (h) => `hostname '${h}' contains 'greenhouse.io'`,
  },
  {
    provider: 'lever',
    match: (h) => h.includes('lever.co'),
    evidence: (h) => `hostname '${h}' contains 'lever.co'`,
  },
  {
    provider: 'workday',
    match: (h) => h.includes('myworkdayjobs.com') || h.includes('workday.com'),
    evidence: (h) => `hostname '${h}' contains workday domain`,
  },
  {
    provider: 'ashby',
    match: (h) => h.includes('ashbyhq.com'),
    evidence: (h) => `hostname '${h}' contains 'ashbyhq.com'`,
  },
  {
    provider: 'personio',
    match: (h) => h.includes('personio.de') || h.includes('personio.com'),
    evidence: (h) => `hostname '${h}' contains personio domain`,
  },
  {
    provider: 'softgarden',
    match: (h) => h.includes('softgarden.de') || h.includes('softgarden.io'),
    evidence: (h) => `hostname '${h}' contains softgarden domain`,
  },
  {
    provider: 'dvinci',
    match: (h) => h.includes('dvinci.de'),
    evidence: (h) => `hostname '${h}' contains 'dvinci.de'`,
  },
]

// Pure domain function — no I/O, no side effects.
// Matches the URL hostname against known ATS patterns.
// Only the hostname is checked — URL path and query params are not ATS signals.
export function detectATSProviderFromUrl(url: string): ATSDetectionResult {
  let hostname: string

  try {
    hostname = new URL(url).hostname.toLowerCase()
  } catch {
    return {
      provider: 'unknown',
      method: 'fallback',
      confidence: 'low',
      evidence: 'url_parse_failed',
    }
  }

  for (const rule of URL_RULES) {
    if (rule.match(hostname)) {
      return {
        provider: rule.provider,
        method: 'url_pattern',
        confidence: 'high',
        evidence: rule.evidence(hostname),
      }
    }
  }

  return {
    provider: 'unknown',
    method: 'fallback',
    confidence: 'low',
    evidence: `hostname '${hostname}' matched no known ATS pattern`,
  }
}

// Extension point — not implemented in MVP.
//
// HTML-marker detection belongs in the adapter layer (not here) because it
// requires fetching page content — an I/O concern the domain must not own.
//
// When implemented, the adapter would:
//   1. Call detectATSProviderFromUrl() first
//   2. If result.provider === 'unknown', fetch the HTML and pass it here
//   3. Both functions return ATSDetectionResult — the contract is stable
//
// export function detectATSProviderFromHtmlMarkers(
//   html: string,
//   priorResult?: ATSDetectionResult,
// ): ATSDetectionResult
