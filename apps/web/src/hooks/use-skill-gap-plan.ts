'use client'

import { useState, useCallback } from 'react'
import type { SkillGapPlan } from '@/domain/mentor-skill-gap'

export type PlanState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; plan: SkillGapPlan }

export function useSkillGapPlan() {
  const [state, setState] = useState<PlanState>({ status: 'idle' })

  const load = useCallback(async () => {
    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/skill-gap/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { type?: string } }
        setState({ status: 'error', message: body?.error?.type ?? 'failed_to_load_plan' })
        return
      }

      const plan = (await res.json()) as SkillGapPlan
      setState({ status: 'ready', plan })
    } catch {
      setState({ status: 'error', message: 'network_error' })
    }
  }, [])

  return { state, load }
}
