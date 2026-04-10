import { z } from 'zod'
import { askChatUseCase } from '@/infrastructure/container'
import { requireApiUser } from '@/modules/auth/server'

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
const exposeDebugDetail = process.env.NODE_ENV !== 'production'

export async function POST(request: Request) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const parsed = requestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: 'Invalid chat payload.' }, { status: 400 })
  }

  const result = await askChatUseCase.execute(parsed.data.messages)

  if (!result.success) {
    if (result.error.type === 'invalid_message_history') {
      return Response.json({ error: result.error.message }, { status: 400 })
    }

    if (result.error.type === 'empty_reply') {
      return Response.json(
        {
          error: result.error.message,
          debugDetail: exposeDebugDetail ? result.error.debugDetail : undefined,
        },
        { status: 502 },
      )
    }

    return Response.json(
      {
        error: result.error.message,
        debugDetail: exposeDebugDetail ? result.error.debugDetail : undefined,
      },
      { status: 502 },
    )
  }

  return Response.json(result.value)
}
