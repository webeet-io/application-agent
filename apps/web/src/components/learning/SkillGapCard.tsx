'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LogProgressButton } from './LogProgressButton'
import type { PrioritizedSkillGap, LearningPath } from '@/domain/mentor-skill-gap'

interface Props {
  gap: PrioritizedSkillGap
  learningPath: LearningPath | undefined
  onProgressLogged?: () => void
}

const BUCKET_LABEL: Record<PrioritizedSkillGap['priorityBucket'], string> = {
  critical_now: 'NOW',
  important_next: 'NEXT',
  strategic_later: 'LATER',
  optional: 'Optional',
}

const BUCKET_STYLE: Record<PrioritizedSkillGap['priorityBucket'], string> = {
  critical_now: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  important_next: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  strategic_later: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  optional: 'bg-muted text-muted-foreground',
}

const READINESS_LABEL: Record<PrioritizedSkillGap['readinessState'], string> = {
  unknown: 'Not started',
  learning: 'In progress',
  demonstrated: 'Demonstrated',
  resume_ready: 'Resume ready',
}

const READINESS_DOT: Record<PrioritizedSkillGap['readinessState'], string> = {
  unknown: 'bg-muted-foreground/40',
  learning: 'bg-blue-500',
  demonstrated: 'bg-green-500',
  resume_ready: 'bg-green-500',
}

const STEP_TYPE_LABEL: Record<string, string> = {
  foundation: 'Learn',
  practice: 'Practice',
  proof: 'Build proof',
}

const EFFORT_LABEL = (minWeeks: number, maxWeeks: number): string =>
  minWeeks === maxWeeks ? `~${minWeeks}w` : `${minWeeks}–${maxWeeks}w`

export function SkillGapCard({ gap, learningPath, onProgressLogged }: Props) {
  const [expanded, setExpanded] = useState(false)

  const eventTypeForStepType = (
    stepType: string,
  ): 'studied_foundation' | 'completed_guided_exercise' | 'built_project' => {
    if (stepType === 'foundation') return 'studied_foundation'
    if (stepType === 'practice') return 'completed_guided_exercise'
    return 'built_project'
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
                BUCKET_STYLE[gap.priorityBucket],
              )}
            >
              {BUCKET_LABEL[gap.priorityBucket]}
            </span>
            <h3 className="text-sm font-semibold text-foreground">{gap.name}</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', READINESS_DOT[gap.readinessState])} />
              {READINESS_LABEL[gap.readinessState]}
            </span>
            {gap.frequencyAcrossRelevantJobs > 0 && (
              <span>
                Appears in {gap.frequencyAcrossRelevantJobs}/{gap.jobsMatchedCount} jobs
              </span>
            )}
          </div>
        </div>

        {learningPath && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse learning path' : 'Expand learning path'}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {expanded ? (
              <>
                Hide <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Path <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Learning path steps */}
      {expanded && learningPath && (
        <div className="border-t border-border px-5 py-4">
          <div className="flex flex-col gap-4">
            {learningPath.steps.map((step) => (
              <div key={step.order} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      {step.order}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {STEP_TYPE_LABEL[step.stepType] ?? step.stepType}
                    </span>
                    <span className="text-xs text-muted-foreground/60">
                      {EFFORT_LABEL(step.estimatedEffort.minWeeks, step.estimatedEffort.maxWeeks)}
                    </span>
                  </div>
                  <LogProgressButton
                    gapName={gap.name}
                    gapKind={gap.kind}
                    stepOrder={step.order}
                    eventType={eventTypeForStepType(step.stepType)}
                    onLogged={onProgressLogged}
                  />
                </div>
                <p className="text-sm text-foreground">{step.objective}</p>
                {step.exitCriteria.length > 0 && (
                  <ul className="flex flex-col gap-0.5 pl-1">
                    {step.exitCriteria.map((criterion) => (
                      <li key={criterion} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                        {criterion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
