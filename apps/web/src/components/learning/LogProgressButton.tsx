'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import type { LearningProgressEvent } from '@/domain/mentor-skill-gap'

interface Props {
  gapName: string
  gapKind: LearningProgressEvent['gapKind']
  stepOrder: number
  eventType: LearningProgressEvent['eventType']
  onLogged?: () => void
}

export function LogProgressButton({ gapName, gapKind, stepOrder, eventType, onLogged }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleClick() {
    setStatus('loading')
    try {
      const res = await fetch('/api/skill-gap/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gapName, gapKind, stepOrder, eventType }),
      })
      if (res.ok) {
        setStatus('done')
        onLogged?.()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
        <CheckCircle className="h-3.5 w-3.5" />
        Logged
      </span>
    )
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => void handleClick()}
      disabled={status === 'loading'}
      className="h-7 px-3 text-xs"
    >
      {status === 'loading' && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
      {status === 'error' ? 'Retry' : 'Mark done'}
    </Button>
  )
}
