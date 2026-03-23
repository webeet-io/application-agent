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
  createdAt: Date
}

export interface Company {
  id: CompanyId
  name: string
  careersUrl: string
  atsProvider: 'greenhouse' | 'lever' | 'workday' | 'ashby' | 'unknown'
}

export interface Job {
  id: JobId
  companyId: CompanyId
  title: string
  location: string
  description: string
  url: string
  scrapedAt: Date
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
