import type { AttemptResult } from '@ceevee/types'
import type { IEmailValidationPort, EmailValidationError, EmailValidationResult } from '@/ports/outbound/IEmailValidationPort'

export class EmailValidationAdapter implements IEmailValidationPort {
  async validate(email: string): Promise<AttemptResult<EmailValidationError, EmailValidationResult>> {
    return {
      success: false,
      error: { type: 'provider_unavailable', message: `Validation provider not configured for ${email}` },
      value: null,
    }
  }
}
