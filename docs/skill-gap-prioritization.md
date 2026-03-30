# Skill Gap Prioritization and Strategy Modes

## Purpose

This document defines how detected recurring gaps should be prioritized for the Skill Gap Learning Paths feature.

This is the design slice for GitHub issue `#24`:

> Implement prioritization and strategy modes

This document builds on:

- [skill-gap-input-contract.md](./skill-gap-input-contract.md)
- [skill-gap-domain-model.md](./skill-gap-domain-model.md)
- [recurring-skill-gap-detection.md](./recurring-skill-gap-detection.md)

## Goal

The purpose of prioritization is to answer:

- which gaps matter most right now
- which gaps matter less
- how ranking changes depending on the user's strategy

Recurring detection identifies candidate gaps.
Prioritization decides what rises to the top.

## Core Rule

Not every recurring gap should be treated equally.

A gap should be prioritized based on:

- how often it appears
- how relevant it is to the user's direction
- how strongly it blocks the user now
- how close the user is to overcoming it
- what strategy mode the user selected

## Inputs to Prioritization

Prioritization should operate on candidate recurring gaps that already contain:

- recurrence information
- evidence
- gap kind
- confidence

It should also consider:

- strategy mode
- target-role relevance
- readiness state
- severity

## Ranking Dimensions

### 1. Frequency

How often the gap appears across the relevant opportunity set.

Why it matters:

- repeated demand is stronger than isolated demand

### 2. Target-Role Relevance

How closely the gap maps to the user's intended direction.

Why it matters:

- a frequent gap outside the intended path should not dominate the learning plan

### 3. Current Blocking Power

How much the absence of the gap reduces competitiveness today.

Why it matters:

- some gaps are real blockers
- some are only polish

### 4. Readiness Distance

How far the user is from making the gap resume-ready.

Why it matters:

- a gap that can be closed quickly may deserve higher short-term priority

### 5. Confidence

How reliable the inference is.

Why it matters:

- the system should not confidently rank weak or noisy gaps too high

## Strategy Modes

### `get_hired_quickly`

This mode should prioritize:

- immediate blockers
- high-frequency requirements
- gaps that can become resume-ready relatively quickly
- practical short-term competitiveness

This mode should de-prioritize:

- low-frequency stretch skills
- long-term but distant capability building

### `long_term_growth`

This mode should prioritize:

- foundational skills
- durable career leverage
- broader long-term capability growth
- skills that raise the user's future ceiling

This mode should tolerate:

- lower immediate payoff
- longer learning timelines

### `balanced`

This mode should combine:

- near-term competitiveness
- long-term skill accumulation

This should be the default mode when the user has not explicitly chosen one.

## Suggested Prioritization Behavior

### For `get_hired_quickly`

Bias strongest toward:

1. high-frequency gaps
2. high target-role relevance
3. low-to-medium readiness distance
4. strong blocking effect

### For `long_term_growth`

Bias strongest toward:

1. broad leverage over time
2. high role relevance
3. strong long-term value
4. capability-building even if not immediately resume-ready

### For `balanced`

Bias strongest toward:

1. high role relevance
2. meaningful recurrence
3. moderate to strong blocking effect
4. a mix of shorter and longer learning paths

## Severity Mapping

Severity should influence ranking but should not fully replace ranking.

Severity answers:

- how much this gap matters

Prioritization answers:

- how soon this gap should be acted on

That distinction matters.

A gap can be:

- high severity but long-term
- lower severity but easy to close quickly

## Prioritization Outcomes

The prioritized output should classify gaps into:

- `critical_now`
- `important_next`
- `strategic_later`
- `optional`

These are not the same as raw severity levels. They are action-oriented categories.

### `critical_now`

Use when:

- the gap blocks strong opportunities immediately
- the gap appears repeatedly
- the gap is highly relevant

### `important_next`

Use when:

- the gap matters meaningfully
- the gap is not the top blocker
- closing it would improve competitiveness soon

### `strategic_later`

Use when:

- the gap matters more for future strength than immediate hiring
- the gap is valuable but not urgent for the current strategy

### `optional`

Use when:

- the gap is low-frequency
- the gap has weak leverage
- the gap is mostly polish

## Suggested Output Shape

```ts
type PrioritizedSkillGap = {
  name: string
  priorityBucket: 'critical_now' | 'important_next' | 'strategic_later' | 'optional'
  rankingScore: number
  strategyMode: 'get_hired_quickly' | 'long_term_growth' | 'balanced'
  whyRankedHere: string
}
```

This can either extend or wrap a `SkillGap` depending on later implementation decisions.

## Ranking Rule of Thumb

For MVP, ranking should roughly behave like this:

- frequent + relevant + blocking + trustworthy -> rank high
- frequent but weakly relevant -> lower
- relevant but low-confidence -> lower
- useful but slow-burn -> medium in balanced mode, higher in long-term-growth mode
- polish -> low

## Ties and Tradeoffs

When two gaps are similar, the system should prefer:

- stronger evidence
- higher target-role relevance
- better actionability

If those are still equal, prefer the gap that is easier to explain and act on.

## What This Enables Next

Once prioritization is defined, the next clean steps are:

1. `GenerateSkillGapPlanUseCase`
2. ordered learning path recommendations
3. tests covering strategy differences and ranking behavior

## Final Rule

Prioritization should make the learning plan feel intentional.

That means:

- not a list of everything missing
- not a random ordering
- not a black box

It should reflect market demand, user direction, and user strategy in an explainable way.
