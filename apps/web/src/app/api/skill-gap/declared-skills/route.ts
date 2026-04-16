import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireApiUser } from '@/modules/auth/server'
import { env } from '@/infrastructure/env'

const VALID_CONFIDENCE = ['low', 'medium', 'high'] as const

export async function GET() {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const supabase = createClient(env.supabase.url(), env.supabase.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase
    .from('user_declared_skills')
    .select('id, skill_name, confidence, evidence, is_on_resume, declared_at')
    .eq('user_id', auth.user.id)
    .order('declared_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'failed to fetch skills' }, { status: 502 })
  }

  return NextResponse.json({ skills: data ?? [] })
}

export async function POST(request: NextRequest) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'body must be an object' }, { status: 400 })
  }

  const b = body as Record<string, unknown>

  if (typeof b.skillName !== 'string' || b.skillName.trim().length === 0) {
    return NextResponse.json({ error: 'skillName is required' }, { status: 400 })
  }

  const confidence = VALID_CONFIDENCE.includes(b.confidence as (typeof VALID_CONFIDENCE)[number])
    ? (b.confidence as (typeof VALID_CONFIDENCE)[number])
    : 'medium'

  const supabase = createClient(env.supabase.url(), env.supabase.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data, error } = await supabase
    .from('user_declared_skills')
    .upsert(
      {
        user_id: auth.user.id,
        skill_name: (b.skillName as string).trim(),
        confidence,
        evidence: typeof b.evidence === 'string' ? b.evidence : null,
        is_on_resume: b.isOnResume === true,
      },
      { onConflict: 'user_id,skill_name' },
    )
    .select('id, skill_name, confidence, evidence, is_on_resume, declared_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'failed to save skill' }, { status: 502 })
  }

  return NextResponse.json({ skill: data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireApiUser()
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const skillName = searchParams.get('skillName')

  if (!skillName) {
    return NextResponse.json({ error: 'skillName query param is required' }, { status: 400 })
  }

  const supabase = createClient(env.supabase.url(), env.supabase.serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { error } = await supabase
    .from('user_declared_skills')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('skill_name', skillName)

  if (error) {
    return NextResponse.json({ error: 'failed to delete skill' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
