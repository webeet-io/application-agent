'use client'

import { useEffect } from 'react'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SkillGapCard } from '@/components/learning/SkillGapCard'
import { DeclaredSkillsPanel } from '@/components/learning/DeclaredSkillsPanel'
import { useSkillGapPlan } from '@/hooks/use-skill-gap-plan'
import type { PrioritizedSkillGap } from '@/domain/mentor-skill-gap'

const STRATEGY_LABEL: Record<string, string> = {
  get_hired_quickly: 'Get hired quickly',
  long_term_growth: 'Long-term growth',
  balanced: 'Balanced',
}

const ERROR_MESSAGE: Record<string, string> = {
  preferences_not_found:
    'Your mentor preferences are not set yet. Set a target role and strategy to generate a plan.',
  resume_not_found: 'No resume found. Upload a resume to get started.',
  resume_signals_missing: 'Resume uploaded but signals could not be extracted yet.',
  network_error: 'Could not reach the server. Check your connection and try again.',
  failed_to_load_plan: 'Something went wrong loading your plan.',
}

const BUCKET_ORDER: PrioritizedSkillGap['priorityBucket'][] = [
  'critical_now',
  'important_next',
  'strategic_later',
  'optional',
]

export function LearningView() {
  const { state, load } = useSkillGapPlan()

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Learning Path</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your personalised plan based on skill gaps in target roles.
            </p>
          </div>
          {state.status === 'ready' && (
            <button
              onClick={() => void load()}
              aria-label="Refresh plan"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          )}
        </div>

        {/* Loading */}
        {state.status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Generating your plan...</p>
          </div>
        )}

        {/* Error */}
        {state.status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {ERROR_MESSAGE[state.message] ?? ERROR_MESSAGE.failed_to_load_plan}
            </p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        )}

        {/* Ready */}
        {state.status === 'ready' && (
          <div className="flex flex-col gap-6">
            {/* Strategy badge + quality warning */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {STRATEGY_LABEL[state.plan.strategyMode] ?? state.plan.strategyMode}
              </span>
              {state.plan.inputQuality.degradedMode !== 'none' && (
                <span className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {state.plan.inputQuality.fallbackSummary}
                </span>
              )}
            </div>

            {/* Declared skills */}
            <DeclaredSkillsPanel />

            {/* Gap cards, grouped by bucket */}
            {state.plan.prioritizedGaps.length === 0 ? (
              <div className="rounded-xl border border-border bg-card px-5 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No skill gaps detected. Add more job listings or update your declared skills.
                </p>
              </div>
            ) : (
              BUCKET_ORDER.map((bucket) => {
                const gaps = state.plan.prioritizedGaps.filter((g) => g.priorityBucket === bucket)
                if (gaps.length === 0) return null
                return (
                  <div key={bucket} className="flex flex-col gap-3">
                    {gaps.map((gap) => (
                      <SkillGapCard
                        key={gap.name}
                        gap={gap}
                        learningPath={state.plan.learningPaths.find((p) => p.gapName === gap.name)}
                        onProgressLogged={() => void load()}
                      />
                    ))}
                  </div>
                )
              })
            )}

            {/* Resources */}
            {state.plan.resourceRecommendations && state.plan.resourceRecommendations.length > 0 && (
              <div className="rounded-xl border border-border bg-card px-5 py-4">
                <h2 className="mb-3 text-sm font-semibold text-foreground">Recommended resources</h2>
                <div className="flex flex-col gap-2.5">
                  {state.plan.resourceRecommendations.map((resource, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <div className="flex items-baseline gap-2">
                        {resource.url ? (
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-foreground underline-offset-2 hover:underline"
                          >
                            {resource.title}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-foreground">{resource.title}</span>
                        )}
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {resource.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{resource.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
