// Result type for explicit error handling at I/O boundaries
export type AttemptResult<E, T> =
  | { success: true; error: null; value: T }
  | { success: false; error: E; value: null }

// Branded ID types — prevent passing wrong ID type at compile time
export type ResumeId = string & { readonly _brand: 'ResumeId' }
export type CompanyId = string & { readonly _brand: 'CompanyId' }
export type JobId = string & { readonly _brand: 'JobId' }
export type ApplicationId = string & { readonly _brand: 'ApplicationId' }

export interface Resume {
  id: ResumeId
  userId: string
  label: string
  fileUrl: string
  storagePath: string
  originalFileName: string
  mimeType: string
  sizeBytes: number
  createdAt: Date
}

// Global ATS providers + German-market providers (Personio, Softgarden, d.vinci are common in DE)
export type ATSProvider =
  | 'greenhouse'
  | 'lever'
  | 'workday'
  | 'ashby'
  | 'personio'
  | 'softgarden'
  | 'dvinci'
  | 'unknown'

export interface Company {
  id: CompanyId
  name: string
  careersUrl: string
  atsProvider: ATSProvider
}

export interface Job {
  id: JobId
  companyId: CompanyId
  title: string
  location: string
  description: string
  url: string
  fetchedAt: Date
}

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'rejected' | 'offer' | 'withdrawn'

export interface Application {
  id: ApplicationId
  userId: string
  jobId: JobId
  resumeId: ResumeId
  status: ApplicationStatus
  appliedAt: Date | null
  notes: string | null
}

export interface JobMatch {
  jobId: JobId
  resumeId: ResumeId
  score: number
  reasoning: string
  suggestedTweaks: string[]
}
