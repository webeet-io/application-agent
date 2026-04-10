import { PDFParse } from 'pdf-parse'
import type { AttemptResult } from '@ceevee/types'
import type {
  IResumeTextExtractorPort,
  ResumeTextExtraction,
  ResumeTextExtractorError,
} from '@/ports/outbound/IResumeTextExtractorPort'

function formatRuntimeError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'unknown error'
  }

  return error.message || error.name || 'unknown error'
}

function normalizeExtractedText(text: string): string {
  return text
    .replaceAll('\0', ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export class PdfParseResumeTextExtractorAdapter implements IResumeTextExtractorPort {
  async extract(input: {
    mimeType: string
    content: ArrayBuffer
  }): Promise<AttemptResult<ResumeTextExtractorError, ResumeTextExtraction>> {
    if (input.mimeType !== 'application/pdf') {
      return {
        success: false,
        error: { type: 'unsupported_file_type', mimeType: input.mimeType },
        value: null,
      }
    }

    let parser: PDFParse | null = null

    try {
      parser = new PDFParse({
        data: Buffer.from(input.content),
      })

      const result = await parser.getText()
      const text = normalizeExtractedText(result.text ?? '')

      return {
        success: true,
        error: null,
        value: {
          text,
          pageCount: typeof result.total === 'number' ? result.total : undefined,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'parse_failed',
          message: formatRuntimeError(error),
        },
        value: null,
      }
    } finally {
      if (parser) {
        await parser.destroy().catch(() => undefined)
      }
    }
  }
}
