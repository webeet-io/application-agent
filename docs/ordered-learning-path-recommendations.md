# Ordered Learning Path Recommendations

## Purpose

This document defines how the Skill Gap Learning Paths feature should turn prioritized gaps into an ordered learning path.

This is the design slice for GitHub issue `#25`:

> Generate ordered learning path recommendations

This document builds on:

- [skill-gap-input-contract.md](./skill-gap-input-contract.md)
- [skill-gap-domain-model.md](./skill-gap-domain-model.md)
- [recurring-skill-gap-detection.md](./recurring-skill-gap-detection.md)
- [skill-gap-prioritization.md](./skill-gap-prioritization.md)
- [generate-skill-gap-plan-use-case.md](./generate-skill-gap-plan-use-case.md)

## Goal

Prioritized gaps are not yet a learning path.

This slice exists to answer:

- what should the user learn first
- what should come second
- what should wait
- how the system should turn ranked gaps into concrete progression

The result should feel like a path, not a pile.

## Core Rule

The learning path should not simply mirror ranking order.

The path must consider:

- priority
- dependency order
- learning difficulty
- actionability
- time-to-value

That means a lower-ranked gap may sometimes be learned earlier if it unlocks a higher-ranked one.

## Inputs to Learning Path Generation

This stage should consume:

- prioritized gaps
- strategy mode
- readiness state
- severity
- gap kind

Later versions may also use:

- mentor memory
- study progress
- available time
- resource availability

## Path Design Principles

### 1. Start with leverage

Prefer early steps that unlock multiple opportunities or make later steps easier.

### 2. Avoid overwhelming the user

The first path should be short, intentional, and realistic.

### 3. Balance urgency and feasibility

Do not only recommend the most important gap if it is too large and distant to act on.

### 4. Make progress visible

Each step should have a clear objective and some notion of readiness or completion.

## Suggested Path Structure

For MVP, the learning path should be broken into three layers:

- now
- next
- later

### Now

The first one to three items the user should focus on.

Criteria:

- high leverage
- high actionability
- relevant to strategy mode

### Next

Important items that should follow after early progress is made.

Criteria:

- still meaningful
- somewhat less urgent or less immediately feasible

### Later

Strategic or longer-term items that matter, but should not distract from current focus.

Criteria:

- valuable but lower short-term payoff
- dependent on earlier progress

## Dependency Logic

Some gaps may depend on others.

Examples:

- learning Docker may come before deployment workflows
- stronger SQL foundations may come before database optimization
- one concrete portfolio project may come before trying to claim broader system-design confidence

For MVP, dependency logic can stay simple:

- if one gap is clearly foundational to another, place the foundational gap first

This does not need to become a complex graph engine yet.

## Learning Path Step Shape

Each step should contain:

- what to focus on
- why it matters
- what "done enough" means
- whether it belongs in now, next, or later

Suggested shape:

```ts
type LearningPathStep = {
  order: number
  bucket: 'now' | 'next' | 'later'
  gapName: string
  objective: string
  whyThisStep: string
  exitCriteria: string
}
```

## Strategy Mode Behavior

### `get_hired_quickly`

The path should favor:

- short steps
- fast resume-relevant wins
- practical blockers

This mode should avoid:

- spending too much early path space on large long-term foundations

### `long_term_growth`

The path should favor:

- deeper capability building
- foundational skills
- broader leverage steps

This mode can tolerate:

- longer time-to-value
- fewer immediate application wins

### `balanced`

The path should include:

- one or two quick wins
- one more strategic step

This should be the default.

## Recommendation Rules

For MVP, a good path should usually:

1. begin with a high-leverage, reasonably reachable gap
2. follow with another meaningful but slightly broader step
3. leave larger strategic gaps for later unless strategy mode strongly favors them

## What Makes a Good Step

A learning path step should be:

- concrete
- explainable
- realistically actionable

Bad step:

- "Become great at backend systems"

Better step:

- "Learn Docker well enough to containerize and run one small project locally"

## Path Length

For MVP, the generated path should stay compact.

Suggested limit:

- 3 items in `now`
- 2 to 4 items in `next`
- 2 to 4 items in `later`

This keeps the output useful and avoids turning the feature into a bloated wishlist.

## Output Shape

Suggested feature-level output:

```ts
type OrderedLearningPath = {
  strategyMode: 'get_hired_quickly' | 'long_term_growth' | 'balanced'
  now: LearningPathStep[]
  next: LearningPathStep[]
  later: LearningPathStep[]
}
```

## What This Stage Does Not Do

For MVP, this stage should not:

- select exact learning resources
- estimate hours precisely
- create daily schedules
- manage mentor follow-up

Those belong to later feature slices.

## Why This Matters

Without this stage, the product risks producing:

- a ranked list with no progression
- too many items
- no sense of what to do first

Ordered learning path generation is what turns analysis into direction.

## What This Enables Next

Once this is defined, the remaining important design-only slice is:

- the learning resource recommendation boundary

After that, the main design path is effectively complete and implementation should take priority.

## Final Rule

The learning path should help the user move, not just understand.

That means:

- fewer steps
- clearer steps
- better sequencing
