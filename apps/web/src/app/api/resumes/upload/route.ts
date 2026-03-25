import { NextRequest, NextResponse } from 'next/server'
import { uploadResumeUseCase } from '@/infrastructure/container'

// Delivery layer responsibility: parse the HTTP request, call the use case, return a response.
// No business logic here.
export async function POST(request: NextRequest) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  const label = formData.get('label')
  const userId = formData.get('userId')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  if (typeof label !== 'string' || label.trim().length === 0) {
    return NextResponse.json({ error: 'label is required' }, { status: 400 })
  }

  if (typeof userId !== 'string' || userId.trim().length === 0) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const content = await file.arrayBuffer()

  const result = await uploadResumeUseCase.execute({
    userId,
    label: label.trim(),
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    content,
  })

  if (!result.success) {
    if (result.error.type === 'invalid_file_type') {
      return NextResponse.json({ error: 'only PDF files are supported' }, { status: 400 })
    }

    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  return NextResponse.json({ resume: result.value }, { status: 201 })
}
