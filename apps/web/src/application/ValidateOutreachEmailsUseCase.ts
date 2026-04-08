import type { AttemptResult } from '@ceevee/types'
import type { IEmailValidationPort, EmailValidationError, EmailValidationResult } from '@/ports/outbound/IEmailValidationPort'

export class ValidateOutreachEmailsUseCase {
  constructor(private readonly validation: IEmailValidationPort) {}

  async execute(emails: string[], minConfidence = 0.7): Promise<AttemptResult<EmailValidationError, EmailValidationResult[]>> {
    const results: EmailValidationResult[] = []

    for (const email of emails) {
      const result = await this.validation.validate(email)
      if (!result.success) return result

      if (result.value.status === 'valid' && result.value.confidence >= minConfidence) {
        results.push(result.value)
      }
    }

    return { success: true, error: null, value: results }
  }
}
