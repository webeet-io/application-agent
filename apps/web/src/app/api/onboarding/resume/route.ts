import { NextRequest, NextResponse } from 'next/server'
import { attachResumeToOnboardingSessionUseCase } from '@/infrastructure/container'
import { requireApiUser } from '@/modules/auth/server'

function deriveResumeLabel(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^/.]+$/, '')
  return withoutExtension.trim().length > 0 ? withoutExtension : 'Resume upload'
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  const sessionId = formData.get('sessionId')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
  }

  const content = await file.arrayBuffer()

  const result = await attachResumeToOnboardingSessionUseCase.execute({
    sessionId: sessionId.trim(),
    userId: auth.user.id,
    label: deriveResumeLabel(file.name),
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    content,
  })

  if (!result.success) {
    if (result.error.type === 'invalid_file_type') {
      return NextResponse.json({ error: 'only PDF files are supported' }, { status: 400 })
    }

    if (result.error.type === 'invalid_input') {
      return NextResponse.json({ error: result.error.message }, { status: 400 })
    }

    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json(result.value, { status: 200 })
}
