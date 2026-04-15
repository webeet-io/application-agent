'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Check, MapPin, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getInitialAppliedIds,
  getOpportunityMatchBand,
  getOpportunitySetKey,
  rankOpportunities,
  summarizeOpportunities,
} from '../opportunity-feed-model'
import type { Opportunity, OpportunityMatchBand } from '../types'

type OpportunityFeedProps = {
  opportunities: Opportunity[]
  searchPrompt?: string
}

function getMatchTone(matchBand: OpportunityMatchBand) {
  if (matchBand === 'excellent') {
    return {
      label: 'Excellent match',
      bar: 'bg-brand-green',
      badge: 'border-brand-green/30 bg-brand-green/10 text-primary',
    }
  }

  if (matchBand === 'strong') {
    return {
      label: 'Strong match',
      bar: 'bg-primary',
      badge: 'border-primary/20 bg-primary/5 text-primary',
    }
  }

  return {
    label: 'Worth reviewing',
    bar: 'bg-brand-mauve',
    badge: 'border-brand-mauve/25 bg-brand-mauve/10 text-brand-mauve',
  }
}

export function OpportunityFeed({ opportunities: initialOpportunities, searchPrompt }: OpportunityFeedProps) {
  const opportunitySetKey = useMemo(() => getOpportunitySetKey(initialOpportunities), [initialOpportunities])
  const [appliedIds, setAppliedIds] = useState(() => getInitialAppliedIds(initialOpportunities))

  useEffect(() => {
    setAppliedIds(getInitialAppliedIds(initialOpportunities))
  }, [opportunitySetKey])

  const opportunities = useMemo(() => {
    const opportunitiesWithAppliedState = initialOpportunities.map((opportunity) => ({
      ...opportunity,
      applied: appliedIds.has(opportunity.id),
    }))

    return rankOpportunities(opportunitiesWithAppliedState)
  }, [appliedIds, initialOpportunities])

  const summary = summarizeOpportunities(opportunities)

  function markApplied(id: string) {
    setAppliedIds((current) => {
      const next = new Set(current)
      next.add(id)
      return next
    })
  }

  if (opportunities.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">No opportunities yet</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Try a broader search, add more target locations, or run discovery again when new roles are available.
          </p>
          <Button asChild className="mt-6">
            <a href="/">
              Start a new search
              <RefreshCw className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8 lg:px-10">
        <header className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-mauve">Ranked from your career profile</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Opportunities</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              {searchPrompt ? `Search: ${searchPrompt}` : 'Preview feed using mocked discovery results.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div className="rounded-md border bg-card px-4 py-3">
              <p className="font-semibold text-foreground">{summary.totalCount}</p>
              <p className="text-muted-foreground">roles found</p>
            </div>
            <div className="rounded-md border bg-card px-4 py-3">
              <p className="font-semibold text-foreground">{summary.topMatchPercentage}%</p>
              <p className="text-muted-foreground">top match</p>
            </div>
            <div className="rounded-md border bg-card px-4 py-3">
              <p className="font-semibold text-foreground">{summary.averageMatchPercentage}%</p>
              <p className="text-muted-foreground">avg. match</p>
            </div>
            <div className="rounded-md border bg-card px-4 py-3">
              <p className="font-semibold text-foreground">{summary.appliedCount}</p>
              <p className="text-muted-foreground">applied</p>
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-4" aria-label="Ranked job opportunities">
          {opportunities.map((opportunity, index) => {
            const matchBand = getOpportunityMatchBand(opportunity.matchPercentage)
            const tone = getMatchTone(matchBand)

            return (
              <article
                key={opportunity.id}
                className="grid gap-5 rounded-md border bg-card p-5 shadow-sm md:grid-cols-[minmax(0,1fr)_220px]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-semibold text-secondary-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-foreground">{opportunity.roleTitle}</h2>
                      <p className="text-sm font-medium text-muted-foreground">{opportunity.companyName}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      {opportunity.location}
                    </span>
                    <span className={cn('rounded-md border px-2.5 py-1 text-xs font-medium', tone.badge)}>
                      {tone.label}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-foreground">{opportunity.matchReason}</p>
                  {opportunity.sourceCompanyReason && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {opportunity.sourceCompanyReason}
                    </p>
                  )}
                </div>

                <div className="flex flex-col justify-between gap-5">
                  <div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-muted-foreground">Match score</span>
                      <span className="text-2xl font-semibold text-foreground">{opportunity.matchPercentage}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-md bg-muted">
                      <div
                        className={cn('h-full rounded-md', tone.bar)}
                        style={{ width: `${opportunity.matchPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                    {opportunity.applyUrl ? (
                      <Button asChild variant="outline" className="w-full">
                        <a href={opportunity.applyUrl} target="_blank" rel="noreferrer">
                          Apply
                          <ArrowUpRight className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" className="w-full" disabled>
                        Apply link pending
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={opportunity.applied ? 'secondary' : 'default'}
                      className="w-full"
                      disabled={opportunity.applied}
                      onClick={() => markApplied(opportunity.id)}
                    >
                      {opportunity.applied && <Check className="h-4 w-4" />}
                      {opportunity.applied ? 'Applied' : 'Mark applied'}
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}
