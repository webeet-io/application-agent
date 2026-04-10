import { describe, expect, it } from 'vitest'
import { detectATSProviderFromUrl } from './ats-provider-detection'

describe('detectATSProviderFromUrl', () => {
  describe('known providers — positive matches', () => {
    it('detects greenhouse from boards subdomain', () => {
      const result = detectATSProviderFromUrl('https://boards.greenhouse.io/acmecorp')
      expect(result.provider).toBe('greenhouse')
      expect(result.method).toBe('url_pattern')
      expect(result.confidence).toBe('high')
      expect(result.evidence).toContain('greenhouse.io')
    })

    it('detects greenhouse from embed URL', () => {
      const result = detectATSProviderFromUrl('https://boards.greenhouse.io/embed/job_board?for=acmecorp')
      expect(result.provider).toBe('greenhouse')
      expect(result.confidence).toBe('high')
    })

    it('detects lever from jobs subdomain', () => {
      const result = detectATSProviderFromUrl('https://jobs.lever.co/acmecorp')
      expect(result.provider).toBe('lever')
      expect(result.method).toBe('url_pattern')
      expect(result.confidence).toBe('high')
    })

    it('detects workday from myworkdayjobs domain', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.wd3.myworkdayjobs.com/careers')
      expect(result.provider).toBe('workday')
      expect(result.confidence).toBe('high')
    })

    it('detects workday from workday.com domain', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.workday.com/en-US/jobs')
      expect(result.provider).toBe('workday')
      expect(result.confidence).toBe('high')
    })

    it('detects ashby from ashbyhq.com', () => {
      const result = detectATSProviderFromUrl('https://jobs.ashbyhq.com/acmecorp')
      expect(result.provider).toBe('ashby')
      expect(result.confidence).toBe('high')
    })

    it('detects personio from personio.de', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.jobs.personio.de')
      expect(result.provider).toBe('personio')
      expect(result.confidence).toBe('high')
    })

    it('detects personio from personio.com', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.jobs.personio.com')
      expect(result.provider).toBe('personio')
      expect(result.confidence).toBe('high')
    })

    it('detects softgarden from softgarden.de', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.softgarden.de/jobs')
      expect(result.provider).toBe('softgarden')
      expect(result.confidence).toBe('high')
    })

    it('detects softgarden from softgarden.io', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.softgarden.io/jobs')
      expect(result.provider).toBe('softgarden')
      expect(result.confidence).toBe('high')
    })

    it('detects dvinci from dvinci.de', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.dvinci.de/jobs')
      expect(result.provider).toBe('dvinci')
      expect(result.confidence).toBe('high')
    })
  })

  describe('unknown providers', () => {
    it('returns unknown for a custom company careers page', () => {
      const result = detectATSProviderFromUrl('https://careers.acmecorp.com/jobs')
      expect(result.provider).toBe('unknown')
      expect(result.method).toBe('fallback')
      expect(result.confidence).toBe('low')
    })

    it('returns unknown for a generic company website', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.com/careers')
      expect(result.provider).toBe('unknown')
      expect(result.confidence).toBe('low')
    })
  })

  describe('false positive prevention', () => {
    it('does not match greenhouse when it appears only in the URL path', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.com/blog/greenhouse-report')
      expect(result.provider).toBe('unknown')
    })

    it('does not match lever when it appears only in the URL path', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.com/careers/lever-pull')
      expect(result.provider).toBe('unknown')
    })

    it('does not match workday when it appears only in the URL path', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.com/news/workday-integration')
      expect(result.provider).toBe('unknown')
    })

    it('does not match ashby when it appears only in a query param', () => {
      const result = detectATSProviderFromUrl('https://acmecorp.com/jobs?via=ashbyhq.com')
      expect(result.provider).toBe('unknown')
    })
  })

  describe('edge cases', () => {
    it('returns fallback for a malformed URL', () => {
      const result = detectATSProviderFromUrl('not-a-url')
      expect(result.provider).toBe('unknown')
      expect(result.method).toBe('fallback')
      expect(result.evidence).toBe('url_parse_failed')
    })

    it('returns fallback for an empty string', () => {
      const result = detectATSProviderFromUrl('')
      expect(result.provider).toBe('unknown')
      expect(result.method).toBe('fallback')
      expect(result.evidence).toBe('url_parse_failed')
    })

    it('handles uppercase URLs correctly', () => {
      const result = detectATSProviderFromUrl('HTTPS://BOARDS.GREENHOUSE.IO/ACMECORP')
      expect(result.provider).toBe('greenhouse')
    })

    it('handles URLs with trailing slashes and deep paths', () => {
      const result = detectATSProviderFromUrl('https://jobs.lever.co/acmecorp/abc123-role-title/')
      expect(result.provider).toBe('lever')
    })
  })
})
