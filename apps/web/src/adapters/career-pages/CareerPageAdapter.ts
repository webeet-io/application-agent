import type { ICareerPagePort, CareerPageResult, CareerPageError, JobListing } from '@/ports/outbound/ICareerPagePort'
import type { AttemptResult, ATSProvider } from '@ceevee/types'
import { detectATSProviderFromUrl } from '@/domain/ats-provider-detection'

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[]
interface JsonObject {
  [key: string]: JsonValue
}

export class CareerPageAdapter implements ICareerPagePort {
  async fetchJobs(url: string, provider?: ATSProvider): Promise<AttemptResult<CareerPageError, CareerPageResult>> {
    const detectedProvider = provider && provider !== 'unknown' ? provider : detectATSProviderFromUrl(url).provider

    if (detectedProvider === 'greenhouse') {
      return fetchGreenhouseJobs(url)
    }

    if (detectedProvider === 'lever') {
      return fetchLeverJobs(url)
    }

    if (detectedProvider === 'unknown') {
      return fetchGenericJobs(url)
    }

    return { success: false, error: { type: 'ats_not_supported', atsProvider: detectedProvider }, value: null }
  }
}

async function fetchGreenhouseJobs(url: string): Promise<AttemptResult<CareerPageError, CareerPageResult>> {
  const company = extractGreenhouseCompany(url)
  if (!company) {
    return { success: false, error: { type: 'parse_failed', raw: 'Unable to resolve Greenhouse company slug.' }, value: null }
  }

  const apiUrl = `https://boards.greenhouse.io/${company}?json=1`
  const jsonResult = await fetchJson(apiUrl)
  if (!jsonResult.success) return jsonResult

  const jobs: JobListing[] = []
  const data = jsonResult.value as JsonObject

  const directJobs = Array.isArray(data.jobs) ? data.jobs : []
  directJobs.forEach((job) => pushGreenhouseJob(jobs, job))

  const departments = Array.isArray(data.departments) ? data.departments : []
  departments.forEach((dept) => {
    if (dept && typeof dept === 'object') {
      const departmentJobs = (dept as JsonObject).jobs
      if (Array.isArray(departmentJobs)) {
        departmentJobs.forEach((job: JsonValue) => pushGreenhouseJob(jobs, job))
      }
    }
  })

  return {
    success: true,
    error: null,
    value: {
      jobs,
      atsProvider: 'greenhouse',
    },
  }
}

function pushGreenhouseJob(target: JobListing[], job: JsonValue) {
  if (!job || typeof job !== 'object') return
  const jobObj = job as JsonObject
  const title = readString(jobObj.title)
  const location = readString((jobObj.location as JsonObject | undefined)?.name)
  const url = readString(jobObj.absolute_url ?? jobObj.url)
  const description = readString(jobObj.content ?? jobObj.description)

  if (!title && !url) return

  target.push({
    title: title || 'Untitled role',
    location: location || 'Unknown',
    url: url || '',
    description: description || '',
  })
}

async function fetchLeverJobs(url: string): Promise<AttemptResult<CareerPageError, CareerPageResult>> {
  const company = extractLeverCompany(url)
  if (!company) {
    return { success: false, error: { type: 'parse_failed', raw: 'Unable to resolve Lever company slug.' }, value: null }
  }

  const apiUrl = `https://api.lever.co/v0/postings/${company}?mode=json`
  const jsonResult = await fetchJson(apiUrl)
  if (!jsonResult.success) return jsonResult

  const data = jsonResult.value
  const rows = Array.isArray(data) ? data : []
  const jobs: JobListing[] = rows.map((row) => {
    const obj = row as JsonObject
    const title = readString(obj.text)
    const location = readString((obj.categories as JsonObject | undefined)?.location)
    const urlValue = readString(obj.applyUrl ?? obj.hostedUrl ?? obj.url)
    const description = readString(obj.descriptionPlain ?? obj.description)

    return {
      title: title || 'Untitled role',
      location: location || 'Unknown',
      url: urlValue || '',
      description: description || '',
    }
  })

  return {
    success: true,
    error: null,
    value: {
      jobs,
      atsProvider: 'lever',
    },
  }
}

async function fetchGenericJobs(url: string): Promise<AttemptResult<CareerPageError, CareerPageResult>> {
  const htmlResult = await fetchText(url)
  if (!htmlResult.success) return htmlResult

  const { jobs, hadParseError } = extractJobsFromJsonLd(htmlResult.value, url)

  if (jobs.length === 0 && hadParseError) {
    return { success: false, error: { type: 'parse_failed', raw: 'Failed to parse JSON-LD job data.' }, value: null }
  }

  return {
    success: true,
    error: null,
    value: {
      jobs,
      atsProvider: 'unknown',
    },
  }
}

async function fetchJson(url: string): Promise<AttemptResult<CareerPageError, JsonValue>> {
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) {
    return {
      success: false,
      error: { type: 'fetch_failed', url, message: `HTTP ${response.status}` },
      value: null,
    }
  }

  try {
    const data = (await response.json()) as JsonValue
    return { success: true, error: null, value: data }
  } catch (error) {
    return {
      success: false,
      error: { type: 'parse_failed', raw: error instanceof Error ? error.message : 'invalid json' },
      value: null,
    }
  }
}

async function fetchText(url: string): Promise<AttemptResult<CareerPageError, string>> {
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) {
    return {
      success: false,
      error: { type: 'fetch_failed', url, message: `HTTP ${response.status}` },
      value: null,
    }
  }

  try {
    const data = await response.text()
    return { success: true, error: null, value: data }
  } catch (error) {
    return {
      success: false,
      error: { type: 'parse_failed', raw: error instanceof Error ? error.message : 'invalid html' },
      value: null,
    }
  }
}

function extractGreenhouseCompany(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    if (!host.includes('greenhouse.io')) return null

    const pathParts = parsed.pathname.split('/').filter(Boolean)
    if (pathParts.length === 0) return null

    if (pathParts[0] === 'embed' && pathParts[1] === 'job_board') {
      const companyParam = parsed.searchParams.get('for')
      return companyParam || null
    }

    return pathParts[0]
  } catch {
    return null
  }
}

function extractLeverCompany(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.toLowerCase()
    if (!host.includes('lever.co')) return null

    const pathParts = parsed.pathname.split('/').filter(Boolean)
    return pathParts[0] ?? null
  } catch {
    return null
  }
}


function extractJobsFromJsonLd(html: string, baseUrl: string): { jobs: JobListing[]; hadParseError: boolean } {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  const jobs: JobListing[] = []
  let hadParseError = false

  let match: RegExpExecArray | null
  while ((match = scriptRegex.exec(html))) {
    const raw = match[1].trim()
    if (!raw) continue

    try {
      const parsed = JSON.parse(raw) as JsonValue
      collectJsonLdJobs(parsed, baseUrl, jobs)
    } catch {
      hadParseError = true
    }
  }

  return { jobs, hadParseError }
}

function collectJsonLdJobs(data: JsonValue, baseUrl: string, out: JobListing[]) {
  const nodes = flattenJsonLd(data)

  nodes.forEach((node) => {
    if (!node || typeof node !== 'object') return
    const obj = node as JsonObject
    if (!isJobPosting(obj)) return

    const title = readString(obj.title ?? obj.name)
    const description = readString(obj.description)
    const url = readString(obj.url) || baseUrl
    const location = extractLocation(obj.jobLocation)

    out.push({
      title: title || 'Untitled role',
      description: description || '',
      location: location || 'Unknown',
      url,
    })
  })
}

function flattenJsonLd(data: JsonValue): JsonValue[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== 'object') return []

  const obj = data as JsonObject
  if (Array.isArray(obj['@graph'])) return obj['@graph'] as JsonValue[]

  return [obj]
}

function isJobPosting(obj: JsonObject): boolean {
  const type = obj['@type']
  if (typeof type === 'string') return type.toLowerCase() === 'jobposting'
  if (Array.isArray(type)) return type.some((entry) => typeof entry === 'string' && entry.toLowerCase() === 'jobposting')
  return false
}

function extractLocation(input: JsonValue): string {
  if (!input) return ''
  if (typeof input === 'string') return input

  if (Array.isArray(input)) {
    return input
      .map((item) => extractLocation(item))
      .filter(Boolean)
      .join('; ')
  }

  if (typeof input === 'object') {
    const obj = input as JsonObject
    const address = obj.address
    if (typeof address === 'string') return address

    if (address && typeof address === 'object') {
      const addressObj = address as JsonObject
      const parts = [
        readString(addressObj.addressLocality),
        readString(addressObj.addressRegion),
        readString(addressObj.addressCountry),
      ].filter(Boolean)

      return parts.join(', ')
    }
  }

  return ''
}

function readString(value: JsonValue | undefined): string {
  return typeof value === 'string' ? value.trim() : ''
}
