# GenerateSkillGapPlanUseCase

## Purpose

This document defines the application-layer use case for Skill Gap Learning Paths.

This is the design slice for GitHub issue `#21`:

> Create `GenerateSkillGapPlanUseCase`

This use case should orchestrate the input contract, recurring detection, and prioritization logic into one feature-level flow.

This document builds on:

- [skill-gap-input-contract.md](./skill-gap-input-contract.md)
- [skill-gap-domain-model.md](./skill-gap-domain-model.md)
- [recurring-skill-gap-detection.md](./recurring-skill-gap-detection.md)
- [skill-gap-prioritization.md](./skill-gap-prioritization.md)

## Why This Use Case Exists

The domain documents define:

- what the feature consumes
- what the feature reasons about
- how recurring gaps are detected
- how gaps are prioritized

The use case exists to:

- gather the needed inputs
- call domain logic in the correct order
- handle missing or failing dependencies
- return a feature-level result

The use case should not own business logic.

## Use Case Responsibility

`GenerateSkillGapPlanUseCase` should:

- receive a request for a skill-gap plan
- fetch or accept the required inputs
- validate that minimum required data exists
- call recurring skill-gap detection
- call prioritization logic
- produce a structured skill-gap plan result

It should not:

- directly implement ranking logic
- directly implement detection logic
- call SDKs itself
- hide product rules in orchestration code

## Inputs

The use case should work with the MVP contract already defined.

At minimum, it needs:

- strategy mode
- resume signals
- opportunity signals

It may also receive:

- application history
- user-declared skills

## Suggested Input Shape

```ts
type GenerateSkillGapPlanInput = {
  userId: string
  strategyMode?: 'get_hired_quickly' | 'long_term_growth' | 'balanced'
}
```

The use case should resolve the underlying data through ports where possible, instead of requiring every raw field to be passed by the caller.

## Likely Ports Needed

For MVP, the use case may need one or more of:

- `IResumeRepositoryPort`
- `IApplicationRepositoryPort`
- `IJobOpportunityPort`
- `IUserSkillProfilePort` later if user-declared skills are stored separately

If some of these ports do not exist yet, the use case contract should still be designed so they can be added without changing the orchestration shape.

## Suggested Orchestration Flow

The use case should roughly follow this sequence:

1. resolve strategy mode
2. fetch resume signals
3. fetch relevant opportunity signals
4. optionally fetch application history
5. optionally fetch user-declared skills
6. validate minimum required inputs
7. run recurring skill-gap detection
8. run prioritization and strategy logic
9. return the structured result

## Minimum Validation Rules

The use case should fail early when:

- no usable resume signals exist
- no usable opportunity signals exist

It should continue when:

- application history is missing
- user-declared skills are missing

That matches the MVP input contract.

## Suggested Output Shape

The use case should return a feature-level result, not just a list of gaps.

Suggested output:

```ts
type GenerateSkillGapPlanOutput = {
  strategyMode: 'get_hired_quickly' | 'long_term_growth' | 'balanced'
  prioritizedGaps: unknown[]
  summary: string
}
```

For MVP, the output can stay compact.
Later versions can expand to include:

- learning recommendations
- ordered path steps
- resource suggestions

## Error Handling

This repo uses `AttemptResult` at adapter and use-case boundaries.

So the use case should return:

```ts
Promise<AttemptResult<GenerateSkillGapPlanError, GenerateSkillGapPlanOutput>>
```

Suggested error cases:

```ts
type GenerateSkillGapPlanError =
  | { type: 'resume_not_found'; userId: string }
  | { type: 'resume_signals_missing'; userId: string }
  | { type: 'opportunities_missing'; userId: string }
```

This can expand later, but MVP should stay small and explicit.

## What the Use Case Should Call

The use case should call domain functions in this shape:

- normalize or resolve input
- detect recurring gaps
- prioritize recurring gaps
- package the result

That is the point where all earlier design slices become one coherent feature workflow.

## What It Should Not Do Yet

For MVP, this use case should not yet:

- generate polished learning resources
- create final weekly plans
- manage mentor memory
- write back user state
- trigger notifications

Those belong to later slices.

## Why This Matters

This use case is important because it becomes the handoff point between design and implementation.

Once this exists clearly:

- route handlers know what to call
- adapters know what data to provide
- tests know what behavior to assert

## What This Enables Next

After the use case is defined, the next natural steps are:

- tests for the use case and domain flow
- learning resource recommendation boundary
- ordered learning path generation

## Final Rule

`GenerateSkillGapPlanUseCase` should orchestrate the feature, not contain the feature.

That means:

- the use case should be simple
- the domain should stay smart
- adapters should stay thin
