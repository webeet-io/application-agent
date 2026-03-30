# Learning Resource Recommendation Boundary

## Purpose

This document defines the boundary for attaching learning resources to prioritized skill gaps and ordered learning paths.

This is the design slice for GitHub issue `#23`:

> Add learning resource recommendation boundary

This document builds on:

- [skill-gap-input-contract.md](./skill-gap-input-contract.md)
- [skill-gap-domain-model.md](./skill-gap-domain-model.md)
- [recurring-skill-gap-detection.md](./recurring-skill-gap-detection.md)
- [skill-gap-prioritization.md](./skill-gap-prioritization.md)
- [generate-skill-gap-plan-use-case.md](./generate-skill-gap-plan-use-case.md)
- [ordered-learning-path-recommendations.md](./ordered-learning-path-recommendations.md)

## Goal

The feature should not stop at:

- identifying a gap
- ranking a gap
- ordering a learning path

It should also help the user answer:

- what should I use to learn this
- where should I start
- what kind of resource fits this step

This document defines where that responsibility belongs in the architecture.

## Why This Needs a Boundary

Resource recommendation can become messy very quickly if it is not isolated.

Without a clear boundary, the system may hide this logic inside:

- the domain layer
- the use case
- an LLM prompt
- UI code

That would make the feature harder to test, harder to evolve, and harder to swap later.

The resource recommendation responsibility should therefore live behind a dedicated boundary.

## Architectural Rule

Resource recommendation is not pure domain logic.

Why:

- resources may come from curated lists
- resources may come from external systems
- resources may be looked up dynamically
- recommendations may involve LLM-assisted phrasing or filtering

Because of that:

- the domain decides what kind of learning help is needed
- the resource boundary decides what resources to return

## Domain vs Boundary Responsibility

### Domain owns

- which gaps matter
- which steps come first
- what kind of learning step is needed
- what the user is trying to achieve

### Resource boundary owns

- which resource options to attach
- whether suggestions come from curated mappings, heuristics, or LLM assistance
- how resource results are shaped

## Suggested Port

The cleanest design is an outbound port such as:

```ts
interface ILearningResourcePort {
  recommendResources(input: LearningResourceRequest): Promise<AttemptResult<LearningResourceError, LearningResourceRecommendation[]>>
}
```

This keeps resource lookup swappable and externalized.

## Suggested Request Shape

The request should be built from already-prioritized feature output.

Suggested shape:

```ts
type LearningResourceRequest = {
  gapName: string
  gapKind: 'hard_skill' | 'signal' | 'experience'
  strategyMode: 'get_hired_quickly' | 'long_term_growth' | 'balanced'
  learningObjective: string
  bucket: 'now' | 'next' | 'later'
}
```

This lets the resource boundary tailor recommendations to both the gap and the step context.

## Suggested Response Shape

```ts
type LearningResourceRecommendation = {
  title: string
  type: 'tutorial' | 'course' | 'documentation' | 'project' | 'exercise' | 'article'
  reason: string
  url: string | null
}
```

This can stay simple for MVP.

## MVP Recommendation Sources

There are three realistic source options:

### 1. Curated static mappings

Example:

- Docker -> official docs, one beginner tutorial, one project idea

Pros:

- deterministic
- testable
- safe

Cons:

- limited coverage
- manual upkeep

### 2. Heuristic or template-based generation

Example:

- for a hard skill, always return:
  - one official source
  - one guided tutorial
  - one project suggestion

Pros:

- still fairly predictable
- easy to scale structurally

Cons:

- may feel generic

### 3. LLM-assisted recommendation

Example:

- use an LLM to suggest tailored resources or learning actions

Pros:

- flexible
- adaptable

Cons:

- less deterministic
- harder to test
- easier to produce low-quality or inconsistent resources

## Recommended MVP Approach

For MVP, the best approach is likely:

- curated or template-based structure first
- LLM assistance only if needed for explanation or optional enrichment

This keeps the system useful without introducing too much noise early.

## Why Not Put Resource Logic in the Domain

The domain should stay focused on:

- gap meaning
- ranking
- sequencing

If resource recommendation lives in the domain:

- the domain becomes tied to external content decisions
- testability drops
- swapping resource sources becomes harder

That would violate the repo architecture.

## Why Not Put Resource Logic in the Use Case

If the use case contains resource selection logic:

- orchestration becomes smart instead of the domain
- external concerns leak into application flow
- evolution becomes harder

The use case should call the resource boundary, not own it.

## Recommendation Timing

Resource recommendations should be attached after:

1. recurring gaps are detected
2. gaps are prioritized
3. path steps are ordered

This matters because the same gap may need different resources depending on:

- whether it is a `now` or `later` step
- whether the user is optimizing for speed or long-term depth

## Failure Behavior

The feature should degrade gracefully if resource recommendation fails.

If the resource boundary fails:

- keep the gap analysis
- keep the ordered path
- return no resources or partial resources
- do not fail the entire feature unless resources are required for the calling flow

This makes resource recommendation an enrichment layer, not a hard dependency.

## Suggested Error Shape

```ts
type LearningResourceError =
  | { type: 'source_unavailable' }
  | { type: 'recommendation_failed'; message: string }
```

MVP error handling should stay minimal and explicit.

## What This Enables

Once this boundary is defined:

- ordered learning paths can be enriched with concrete resources
- the feature can start feeling more useful than just analysis
- different resource strategies can be swapped later without breaking the core design

## Final Rule

The system should decide what the user needs in the domain, and decide how to fetch or attach learning resources at the boundary.

That separation is what keeps the feature clean.
