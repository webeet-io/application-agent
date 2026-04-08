import { z } from 'zod'
import { askChatUseCase } from '@/infrastructure/container'

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      })
    )
    .min(1),
})

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid chat payload.' }, { status: 400 })
  }

  const result = await askChatUseCase.execute(parsed.data.messages)

  if (!result.success) {
    if (result.error.type === 'empty_response') {
      return Response.json({ error: 'The model returned an empty response.' }, { status: 502 })
    }

    return Response.json(
      { error: `OpenAI request failed: ${result.error.message}` },
      { status: 502 }
    )
  }

  return Response.json(result.value)
}
