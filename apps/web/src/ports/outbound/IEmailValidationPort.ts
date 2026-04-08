import type { AttemptResult } from '@ceevee/types'

export type EmailValidationStatus = 'valid' | 'invalid' | 'risky' | 'unknown'

export type EmailValidationError =
  | { type: 'provider_unavailable'; message: string }
  | { type: 'provider_error'; message: string }

export type EmailValidationResult = {
  email: string
  status: EmailValidationStatus
  confidence: number
}

export interface IEmailValidationPort {
  validate(email: string): Promise<AttemptResult<EmailValidationError, EmailValidationResult>>
}
