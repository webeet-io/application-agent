# Recurring Skill Gap Detection

## Purpose

This document defines the recurring skill-gap detection slice for the Skill Gap Learning Paths feature.

This is the design slice for GitHub issue `#22`:

> Implement recurring skill-gap detection

This document builds on:

- [skill-gap-input-contract.md](./skill-gap-input-contract.md)
- [skill-gap-domain-model.md](./skill-gap-domain-model.md)

## Goal

The goal of recurring skill-gap detection is to identify which missing skills or signals show up repeatedly across relevant jobs, instead of reacting to isolated one-off requirements.

The feature should answer:

- what is missing repeatedly
- what is missing in opportunities that actually matter
- which gaps are noise and should be ignored

## Core Rule

A recurring gap is not just "a missing skill."

A recurring gap is:

- absent from the user's trusted signals
- present across multiple relevant jobs
- meaningful enough to influence prioritization

## Inputs Used

Recurring gap detection should work from:

- resume signals
- opportunity signals
- optional application history
- optional user-declared skills

For MVP, the strongest comparison should be:

- user resume signals
- relevant opportunity signals

## Detection Output

Recurring gap detection should produce candidate `SkillGap` items, not final learning plans.

This stage is responsible for:

- identifying candidate gaps
- counting recurrence
- assigning initial confidence
- attaching evidence

This stage is not responsible for:

- final ranking across all strategies
- full recommendation phrasing
- ordered learning steps

## Detection Logic

The basic detection flow should be:

1. normalize user-visible signals
2. normalize opportunity signals
3. compare each relevant job against user signals
4. collect missing skills and signals per job
5. aggregate repeated gaps across the job set
6. remove weak or noisy candidates
7. return candidate gaps with evidence

## Signal Comparison Rules

### User has the signal

A signal should count as present when it appears in at least one trusted source, such as:

- resume skills
- resume experience signals
- resume role signals
- user-declared skills with sufficient confidence

### User does not have the signal

A signal should count as missing when:

- it appears in relevant jobs
- it is not present in trusted user inputs
- there is no strong contradictory evidence

## What Counts as Recurring

For MVP, a gap should be considered recurring if:

- it appears in at least 2 relevant jobs, or
- it appears in a meaningful percentage of the relevant opportunity set

This threshold should stay configurable in the future, but the MVP rule should remain simple and transparent.

Suggested reasoning:

- a signal appearing once is weak evidence
- a signal appearing repeatedly is stronger evidence

## Relevant Jobs Only

Recurring detection should not operate on every job blindly.

It should use only jobs that are already reasonably relevant to the target direction.

That means upstream job filtering matters.

If irrelevant jobs are included, recurring detection will create noise.

For MVP:

- use the opportunity set already filtered for target-role relevance
- ignore jobs with very low target-role relevance

## Gap Evidence Model

Each detected recurring gap should carry evidence that explains why it exists.

Suggested evidence fields:

```ts
type RecurringGapEvidence = {
  jobsMatched: number
  exampleJobTitles: string[]
  missingFromResume: boolean
  contradictedByUserInput: boolean
}
```

This evidence should make later ranking and explanation easier.

## Noise Reduction Rules

The detector should avoid generating low-quality gaps.

Examples of noise:

- one-off niche skills
- generic filler terms
- low-signal buzzwords
- duplicates caused by inconsistent naming

For MVP, the detector should apply these guards:

- ignore signals that appear only once unless they are extremely relevant
- normalize equivalent forms where practical
- do not emit duplicate gaps with slightly different labels
- ignore jobs that fall below the relevance threshold

## Candidate Gap Categories

The detector should emit candidate gaps across these categories:

- hard skills
- signals
- experience gaps

Examples:

- `docker` -> hard skill
- `healthcare domain knowledge` -> signal
- `production deployment experience` -> experience

## Confidence Rules

Detection confidence should be based on evidence quality.

Confidence should increase when:

- the gap appears across many relevant jobs
- the user's trusted signals clearly do not include it
- the signal is specific and concrete

Confidence should decrease when:

- the signal is vague
- the signal appears in only one job
- user-declared skill input suggests the signal may exist after all

## Suggested Domain Outputs

The recurring detector should return a set of candidate gaps shaped enough for later prioritization.

Suggested shape:

```ts
type DetectedRecurringGap = {
  name: string
  kind: 'hard_skill' | 'signal' | 'experience'
  frequencyAcrossJobs: number
  confidence: number
  evidence: {
    jobsMatched: number
    exampleJobTitles: string[]
    missingFromResume: boolean
    contradictedByUserInput: boolean
  }
}
```

This can later be transformed into full `SkillGap` objects once prioritization logic runs.

## Edge Cases

### No relevant jobs

If no relevant jobs are present:

- do not invent recurring gaps
- return an empty set or typed no-data result upstream

### Very sparse job set

If only one relevant job exists:

- recurring detection should be conservative
- avoid overstating one-off signals as a broader market pattern

### User-declared but not resume-visible skills

If the user says they have a skill but it is not on the resume:

- do not immediately treat it as fully missing
- reduce confidence or mark contradiction

### Ambiguous signals

If a signal is too vague:

- do not rank it highly later
- optionally suppress it entirely

## What This Enables Next

Once recurring detection is defined, the next steps are:

1. implement prioritization and strategy-mode behavior
2. connect recurring gaps into `GenerateSkillGapPlanUseCase`
3. add tests around sparse data, relevance filtering, and contradiction handling

## Final Rule

Recurring skill-gap detection should favor trustworthiness over volume.

That means:

- fewer, better gaps
- evidence-backed recurrence
- conservative handling of weak signals
