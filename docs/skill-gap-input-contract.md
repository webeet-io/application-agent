# Skill Gap Learning Paths MVP Input Contract

## Purpose

This document defines the minimum input contract for the Skill Gap Learning Paths feature.

This is the design slice for issue `#19`:

> Define the minimum input shape needed from resume, jobs, application history, and stated skills.

The goal is to make downstream implementation possible without waiting for every upstream feature to be fully complete.

## Feature Context

Skill Gap Learning Paths is part of the larger Mentor feature, but it should not depend on Mentor owning the rest of the platform.

This feature consumes inputs from other product areas and turns them into:

- prioritized skill gaps
- learning recommendations
- ordered learning paths

## Design Goal

The input contract should support three realities:

1. upstream features may be incomplete
2. data may be partial or low quality
3. the feature must still return useful output when possible

Because of that, the input model should distinguish:

- required inputs
- optional but high-value inputs
- fallback behavior when inputs are missing

## Minimum Input Shape

The MVP input should be composed of four input groups:

- resume signals
- opportunity signals
- application history signals
- user-declared skill signals

## 1. Resume Signals

Resume signals are required for MVP.

This feature does not need the raw resume file. It needs a structured representation of the user's current market signals.

### Required fields

- `resumeId`
- `userId`
- `skills`
- `experienceSignals`
- `roleSignals`

### Recommended shape

```ts
type ResumeSignalInput = {
  resumeId: string
  userId: string
  skills: string[]
  experienceSignals: string[]
  roleSignals: string[]
}
```

### Meaning

- `skills`: explicit skills visible on the resume
- `experienceSignals`: technologies, domains, systems, environments, or achievements inferred from experience
- `roleSignals`: signals about what role the resume currently supports, such as frontend, backend, product design, data, DevOps

### Why required

Without resume signals, the feature cannot reliably identify what the user already demonstrates versus what is missing.

## 2. Opportunity Signals

Opportunity signals are required for MVP.

The feature should work on available job openings that were discovered or scraped elsewhere in the product.

### Required fields

- `jobId`
- `title`
- `skillsMentioned`
- `signalsMentioned`
- `relevanceToTarget`

### Recommended shape

```ts
type OpportunitySignalInput = {
  jobId: string
  title: string
  skillsMentioned: string[]
  signalsMentioned: string[]
  relevanceToTarget: number
}
```

### Meaning

- `skillsMentioned`: explicit skill keywords the job asks for
- `signalsMentioned`: broader market signals such as startup experience, healthcare domain knowledge, distributed systems, mentoring, or leadership
- `relevanceToTarget`: a lightweight ranking signal showing whether the job is close to the user's intended direction

### Why required

Without job signals, the feature cannot detect recurring gaps or determine which missing skills matter most in the current opportunity set.

## 3. Application History Signals

Application history is optional for MVP, but high-value.

The feature should still work without history, but the output will be less personalized and less longitudinal.

### Recommended fields

- `jobTitle`
- `status`
- `outcome`
- `rejectedReason`
- `skillsPresent`
- `skillsMissing`

### Recommended shape

```ts
type ApplicationHistorySignalInput = {
  jobTitle: string
  status: 'saved' | 'applied' | 'interview' | 'rejected' | 'offer' | 'withdrawn'
  outcome: string | null
  rejectedReason: string | null
  skillsPresent: string[]
  skillsMissing: string[]
}
```

### Why optional

This data improves prioritization and can reveal repeated blockers, but the feature should not be blocked if no history exists yet.

### MVP fallback

If no application history is present:

- do not infer repeated personal failure patterns
- rely more heavily on resume signals and current job signals

## 4. User-Declared Skill Signals

User-declared skills are optional for MVP.

These are skills the user says they have, even if they are not yet visible on the resume.

### Recommended fields

- `name`
- `confidence`
- `evidence`
- `isOnResume`

### Recommended shape

```ts
type UserDeclaredSkillInput = {
  name: string
  confidence: 'low' | 'medium' | 'high'
  evidence: string | null
  isOnResume: boolean
}
```

### Why optional

These inputs are useful because Mentor should eventually help surface skills the user has but is not presenting well. For MVP, this should enrich the output but not be required.

### MVP fallback

If user-declared skills are missing:

- treat resume-visible signals as the source of truth

## User Strategy Input

Strategy mode is required for prioritization behavior, but it can default if no explicit user setting exists.

### Shape

```ts
type SkillGapStrategyMode = 'get_hired_quickly' | 'long_term_growth' | 'balanced'
```

### Default

If no explicit strategy is provided:

- default to `balanced`

## Optional Future Inputs

These should not block MVP, but the contract should leave room for them:

- mentor memory
- weekly study history
- ignored advice history
- target-role weights
- location preferences
- salary or seniority goals

## Proposed Aggregated Input Contract

```ts
type SkillGapPlanInput = {
  strategyMode: 'get_hired_quickly' | 'long_term_growth' | 'balanced'
  resume: ResumeSignalInput
  opportunities: OpportunitySignalInput[]
  applicationHistory?: ApplicationHistorySignalInput[]
  userDeclaredSkills?: UserDeclaredSkillInput[]
}
```

## Required vs Optional Summary

### Required

- strategy mode, with default available
- resume signals
- opportunity signals

### Optional

- application history
- user-declared skills

## Fallback Rules

The feature should degrade gracefully instead of failing whenever possible.

### If resume signals are missing

- do not run the feature
- return a typed failure at the adapter or use-case boundary

### If opportunity signals are missing

- do not run learning-path prioritization
- return a typed failure at the adapter or use-case boundary

### If application history is missing

- proceed with no personal-pattern weighting

### If user-declared skills are missing

- proceed using resume-visible signals only

## Normalization Expectations

Before inputs reach the core skill-gap domain logic, they should already be normalized enough that:

- skills are lowercase or consistently normalized
- duplicates are reduced
- obviously empty values are removed
- job inputs have already been filtered to relevant opportunities upstream

This normalization may happen in adapters or upstream use cases, not in the domain model itself.

## What This Enables Next

Once this input contract is accepted, the next clean implementation steps are:

1. define the skill-gap domain model
2. implement recurring gap detection
3. implement prioritization and strategy behavior
4. create `GenerateSkillGapPlanUseCase`

## Final Rule

For MVP, the feature should require enough structure to be trustworthy, but not so much that it is blocked by incomplete upstream systems.

That means:

- resume signals and opportunity signals are required
- application history and user-declared skills enrich the result but do not block it
