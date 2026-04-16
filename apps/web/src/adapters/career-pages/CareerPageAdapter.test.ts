import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractAshbySlug, extractPersonioSlug, parsePersonioXml } from './CareerPageAdapter'
import { CareerPageAdapter } from './CareerPageAdapter'

// ---------------------------------------------------------------------------
// extractAshbySlug
// ---------------------------------------------------------------------------
describe('extractAshbySlug', () => {
  it('returns the slug from a standard Ashby URL', () => {
    expect(extractAshbySlug('https://jobs.ashbyhq.com/linear')).toBe('linear')
  })

  it('returns the slug when path has trailing segments', () => {
    expect(extractAshbySlug('https://jobs.ashbyhq.com/vercel/apply')).toBe('vercel')
  })

  it('returns null for a non-Ashby URL', () => {
    expect(extractAshbySlug('https://boards.greenhouse.io/acme')).toBeNull()
  })

  it('returns null for a bare Ashby domain with no slug', () => {
    expect(extractAshbySlug('https://jobs.ashbyhq.com/')).toBeNull()
  })

  it('returns null for a malformed URL', () => {
    expect(extractAshbySlug('not-a-url')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// extractPersonioSlug
// ---------------------------------------------------------------------------
describe('extractPersonioSlug', () => {
  it('returns slug from .personio.de URL', () => {
    expect(extractPersonioSlug('https://acme.jobs.personio.de/job/123')).toBe('acme')
  })

  it('returns slug from .personio.com URL', () => {
    expect(extractPersonioSlug('https://acme.jobs.personio.com/job/456')).toBe('acme')
  })

  it('returns null for a non-Personio URL', () => {
    expect(extractPersonioSlug('https://jobs.lever.co/acme')).toBeNull()
  })

  it('returns null for a malformed URL', () => {
    expect(extractPersonioSlug('not-a-url')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// parsePersonioXml
// ---------------------------------------------------------------------------
describe('parsePersonioXml', () => {
  it('parses a single position block', () => {
    const xml = `
      <positions>
        <position>
          <name>Software Engineer</name>
          <office>Berlin</office>
          <url>https://acme.jobs.personio.de/job/1</url>
          <jobDescription>Build cool stuff.</jobDescription>
        </position>
      </positions>
    `
    const jobs = parsePersonioXml(xml)
    expect(jobs).toHaveLength(1)
    expect(jobs[0].title).toBe('Software Engineer')
    expect(jobs[0].location).toBe('Berlin')
    expect(jobs[0].url).toBe('https://acme.jobs.personio.de/job/1')
    expect(jobs[0].description).toContain('Build cool stuff')
  })

  it('parses multiple positions', () => {
    const xml = `
      <positions>
        <position>
          <name>Role A</name>
          <office>Munich</office>
          <url>https://acme.jobs.personio.de/job/1</url>
          <jobDescription>Desc A</jobDescription>
        </position>
        <position>
          <name>Role B</name>
          <department>Engineering</department>
          <url>https://acme.jobs.personio.de/job/2</url>
          <description>Desc B</description>
        </position>
      </positions>
    `
    const jobs = parsePersonioXml(xml)
    expect(jobs).toHaveLength(2)
    expect(jobs[0].title).toBe('Role A')
    expect(jobs[1].title).toBe('Role B')
    expect(jobs[1].location).toBe('Engineering') // falls back to department
  })

  it('falls back to department when office is absent', () => {
    const xml = `
      <positions>
        <position>
          <name>Designer</name>
          <department>Product</department>
          <url>https://acme.jobs.personio.de/job/3</url>
        </position>
      </positions>
    `
    const jobs = parsePersonioXml(xml)
    expect(jobs[0].location).toBe('Product')
  })

  it('skips positions with neither title nor url', () => {
    const xml = `
      <positions>
        <position>
          <office>Remote</office>
        </position>
      </positions>
    `
    const jobs = parsePersonioXml(xml)
    expect(jobs).toHaveLength(0)
  })

  it('strips CDATA wrappers from description', () => {
    const xml = `
      <positions>
        <position>
          <name>Engineer</name>
          <url>https://acme.jobs.personio.de/job/4</url>
          <jobDescription><![CDATA[<p>Write great code.</p>]]></jobDescription>
        </position>
      </positions>
    `
    const jobs = parsePersonioXml(xml)
    expect(jobs[0].description).toContain('Write great code')
    expect(jobs[0].description).not.toContain('<p>')
    expect(jobs[0].description).not.toContain('CDATA')
  })

  it('returns empty array for empty input', () => {
    expect(parsePersonioXml('')).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// CareerPageAdapter.fetchJobs — HTTP mocking
// ---------------------------------------------------------------------------
describe('CareerPageAdapter.fetchJobs', () => {
  const adapter = new CareerPageAdapter()

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns fetch_failed error when Ashby API is unreachable', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network error'))

    const result = await adapter.fetchJobs('https://jobs.ashbyhq.com/linear', 'ashby')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('fetch_failed')
    }
  })

  it('returns fetch_failed error when Ashby API returns non-OK status', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 503 }),
    )

    const result = await adapter.fetchJobs('https://jobs.ashbyhq.com/linear', 'ashby')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('fetch_failed')
    }
  })

  it('returns jobs on a successful Ashby response', async () => {
    const payload = {
      results: [
        {
          title: 'Staff Engineer',
          jobUrl: 'https://jobs.ashbyhq.com/linear/1',
          location: { locationStr: 'Remote' },
        },
      ],
    }
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    const result = await adapter.fetchJobs('https://jobs.ashbyhq.com/linear', 'ashby')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.jobs).toHaveLength(1)
      expect(result.value.jobs[0].title).toBe('Staff Engineer')
      expect(result.value.atsProvider).toBe('ashby')
    }
  })

  it('returns fetch_failed when Personio XML endpoints fail', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 404 }),
    )

    const result = await adapter.fetchJobs('https://acme.jobs.personio.de', 'personio')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('fetch_failed')
    }
  })

  it('returns jobs on a successful Personio response', async () => {
    const xml = `
      <positions>
        <position>
          <name>Backend Engineer</name>
          <office>Hamburg</office>
          <url>https://acme.jobs.personio.de/job/99</url>
          <jobDescription>Work on our platform.</jobDescription>
        </position>
      </positions>
    `
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(xml, { status: 200 }),
    )

    const result = await adapter.fetchJobs('https://acme.jobs.personio.de', 'personio')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.value.jobs).toHaveLength(1)
      expect(result.value.jobs[0].title).toBe('Backend Engineer')
      expect(result.value.atsProvider).toBe('personio')
    }
  })

  it('returns parse_failed for an unknown Ashby slug', async () => {
    const result = await adapter.fetchJobs('https://jobs.ashbyhq.com/', 'ashby')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.type).toBe('parse_failed')
    }
  })
})
