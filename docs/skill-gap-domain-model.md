# Skill Gap Learning Paths Domain Model and Prioritization Rules

## Purpose

This document defines the core domain model and prioritization rules for the Skill Gap Learning Paths feature.

This is the design slice for GitHub issue `#18`:

> Define the core types and deterministic rules for representing and ranking skill gaps.

This document builds on the MVP input contract defined in [skill-gap-input-contract.md](./skill-gap-input-contract.md).

## Design Goal

The feature should turn structured signals about the user and the opportunity set into:

- a list of meaningful gaps
- a ranking of those gaps
- an ordered learning path

The prioritization logic should be explicit and mostly deterministic.

LLMs may be useful later for phrasing recommendations, but the ranking rules should not depend entirely on opaque model output.

## Core Domain Principles

The Skill Gap Learning Paths feature should follow these rules:

- gaps are derived from evidence, not vague intuition
- recurring market demand matters more than one-off mentions
- the user's strategy mode must affect ranking
- not all gaps are equally urgent
- the system should distinguish between missing hard skills, weak signals, and optional improvements

## Core Types

### `SkillGapKind`

Represents the kind of gap being identified.

```ts
type SkillGapKind = 'hard_skill' | 'signal' | 'experience'
```

Meaning:

- `hard_skill`: explicit tool or technology gap such as Docker, PostgreSQL, React, or TypeScript
- `signal`: broader market signal such as startup experience, domain knowledge, mentorship, ownership, or communication
- `experience`: practice-based gap such as production deployment, system design, or leading projects

### `SkillReadinessState`

Represents how ready a skill is for real job positioning.

```ts
type SkillReadinessState =
  | 'unknown'
  | 'learning'
  | 'demonstrated'
  | 'resume_ready'
```

Meaning:

- `unknown`: not present in any trusted input
- `learning`: user has started learning but has weak evidence
- `demonstrated`: there is some evidence, but not enough to confidently position it
- `resume_ready`: strong enough to be claimed in the resume or highlighted in applications

### `SkillGapSeverity`

Represents how strongly a gap blocks the user.

```ts
type SkillGapSeverity = 'critical' | 'important' | 'useful' | 'optional'
```

Meaning:

- `critical`: frequently blocks relevant opportunities right now
- `important`: meaningfully reduces competitiveness
- `useful`: helpful improvement but not the main blocker
- `optional`: nice to have, low urgency

### `SkillGap`

Represents one gap that the system believes matters.

```ts
type SkillGap = {
  name: string
  kind: SkillGapKind
  severity: SkillGapSeverity
  readinessState: SkillReadinessState
  frequencyAcrossJobs: number
  targetRoleRelevance: number
  confidence: number
  reason: string
}
```

Field meaning:

- `name`: the gap label, for example `docker`, `system design`, `startup experience`
- `kind`: hard skill, signal, or experience
- `severity`: urgency level
- `readinessState`: where the user currently stands
- `frequencyAcrossJobs`: share of relevant jobs where this appears
- `targetRoleRelevance`: how closely this gap maps to the intended direction
- `confidence`: how reliable the gap inference is
- `reason`: short explanation for why the gap was identified

### `LearningRecommendation`

Represents the recommended response to a gap.

```ts
type LearningRecommendation = {
  gapName: string
  priority: number
  goal: string
  whyNow: string
  suggestedAction: string
}
```

### `LearningPathStep`

Represents one ordered step in the learning path.

```ts
type LearningPathStep = {
  order: number
  gapName: string
  objective: string
  exitCriteria: string
}
```

### `LearningPath`

Represents the ordered plan produced by the feature.

```ts
type LearningPath = {
  strategyMode: 'get_hired_quickly' | 'long_term_growth' | 'balanced'
  prioritizedGaps: SkillGap[]
  recommendations: LearningRecommendation[]
  steps: LearningPathStep[]
}
```

## Gap Categories

The system should classify gaps into three practical categories:

- hard blockers
- accelerators
- polish improvements

### Hard blockers

These are the most important for hiring viability.

Examples:

- a core stack tool required by many target jobs
- an experience pattern explicitly demanded by the job set
- a recurring gap that makes the user non-competitive right now

### Accelerators

These improve competitiveness meaningfully but are not strict blockers.

Examples:

- one adjacent stack skill
- one stronger domain signal
- one stronger ownership or product-thinking signal

### Polish improvements

These improve quality and differentiation but should not outrank core blockers.

Examples:

- minor tooling additions
- secondary frameworks
- low-frequency preferences

## Prioritization Inputs

The prioritization logic should use these signals:

### 1. Frequency across relevant jobs

How often a gap appears in the opportunity set.

Why it matters:

- repeated demand is more important than isolated demand

### 2. Relevance to the target role

How tightly the gap maps to the user's intended career path.

Why it matters:

- a frequent skill outside the target path should not dominate the plan

### 3. Severity of absence

How much the gap blocks current competitiveness.

Why it matters:

- some missing items are optional
- others are direct blockers

### 4. Current readiness state

Whether the user is starting from zero or is already close.

Why it matters:

- a nearly-demonstrated skill may be a better short-term investment than a totally missing stretch skill

### 5. Strategy mode

How the user wants the system to optimize.

Why it matters:

- different users want different tradeoffs

## Strategy Modes

### `get_hired_quickly`

Bias toward:

- immediate market relevance
- fast-closing blockers
- near-term resume improvements

This mode should favor:

- high-frequency gaps
- high target-role relevance
- gaps that can realistically move to `resume_ready` soon

### `long_term_growth`

Bias toward:

- compounding career value
- durable capabilities
- stronger long-term positioning

This mode should favor:

- foundational skills
- broad career leverage
- gaps that improve the user's ceiling, not just immediate fit

### `balanced`

Bias toward:

- a mix of immediate competitiveness and long-term value

This should be the default mode.

## Severity Rules

Severity should not be manually guessed. It should be derived from evidence.

Suggested default logic:

- `critical`
  - high frequency
  - high target-role relevance
  - low readiness
- `important`
  - moderate to high frequency
  - meaningful relevance
  - partial or weak readiness
- `useful`
  - moderate relevance or lower repetition
- `optional`
  - low-frequency or low-leverage improvement

## Confidence Rules

Confidence should reflect how reliable the gap inference is.

Confidence should be higher when:

- the signal appears across multiple relevant jobs
- the resume clearly lacks that signal
- user-declared skills do not contradict the finding

Confidence should be lower when:

- only one low-quality job mentions it
- the resume evidence is ambiguous
- the gap depends on weak inference rather than clear signal

## Prioritization Rule of Thumb

For MVP, the ranking should approximately follow:

1. high-frequency, high-relevance, low-readiness gaps
2. high-relevance gaps that are close to becoming resume-ready
3. strategic long-term gaps that materially raise the user's ceiling
4. lower-impact polish items

## Recommended Domain Flow

The domain flow should look like:

1. derive candidate gaps from inputs
2. classify each gap by kind
3. compute frequency, relevance, readiness, and confidence
4. assign severity
5. rank according to strategy mode
6. convert ranked gaps into learning recommendations
7. convert recommendations into ordered learning path steps

## What This Enables Next

Once this model is accepted, the next clean steps are:

1. recurring skill-gap detection
2. prioritization and strategy-mode logic
3. `GenerateSkillGapPlanUseCase`

## Final Rule

For MVP, the system should optimize for useful and explainable prioritization.

That means:

- prefer explicit ranking inputs over vague heuristics
- prefer evidence-backed gaps over speculative coaching
- prefer a short, actionable path over a long generic wishlist
