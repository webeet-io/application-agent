# Mentor Feature Architecture

## Purpose

This document defines the architecture of the Mentor feature within the broader CeeVee MVP.

Mentor is not the whole product.
Mentor is one feature area inside the larger application.

The Mentor feature is responsible for:

- interpreting a user's career direction
- evaluating the user's current readiness
- comparing the user against available jobs
- identifying strengths and gaps
- recommending next actions
- remembering progress and coaching history over time

The Mentor feature is not responsible for owning the entire platform.

It depends on other product capabilities, such as:

- resume upload and storage
- job ingestion or scraping
- application tracking
- user account and settings infrastructure

Those capabilities may be implemented by other contributors or features. Mentor should consume them through ports and domain-safe types, not own them.

## Product Position

Mentor should be treated as a persistent career coaching system, not as a generic chat assistant.

The intended user experience is:

1. The user uploads a resume somewhere else in the product
2. Mentor becomes available automatically
3. Mentor either:
   - uses default settings, or
   - asks the user to configure mentor preferences
4. Mentor assesses the user's resume, goals, jobs, and history
5. Mentor produces:
   - a shortlist of realistic jobs
   - coaching notes for those jobs
   - skill gaps
   - suggested learning resources
   - a weekly action plan
6. Mentor keeps adapting over time using memory and new outcomes

Mentor should feel proactive, consistent, and dependable.

## MVP Goal

For MVP, the most important Mentor outcome is:

> Show the user a shortlist of viable jobs with coaching notes, based on the user's resume, goals, and settings.

The MVP should also begin building the persistence and memory needed for Mentor to feel ongoing rather than one-off.

## Feature Boundaries

### Mentor owns

- mentor profile and preferences
- mentor-specific orchestration
- job-fit explanation
- gap analysis
- coaching notes
- weekly action planning
- mentor memory and follow-up behavior

### Mentor depends on

- resume data
- available job data
- application history
- user identity
- user settings persistence

### Mentor does not own

- resume upload UI
- resume file parsing pipeline if built elsewhere
- raw job scraping pipeline
- general auth or session management
- the full application tracker

This boundary matters. The feature should be designed so that Mentor can be built independently even when upstream features are unfinished or changing.

## User Configuration Model

Mentor should be configurable by the user.

The user should be able to define or adjust:

- target role or roles
- preferred geography
- preferred industry or company type
- strategy mode:
  - get hired quickly
  - optimize for long-term growth
  - balanced
- mentor tone:
  - supportive
  - strict
  - adaptive
- opinion strength:
  - low
  - medium
  - high
- ranking weights between:
  - resume evidence
  - stated goals
  - available jobs
  - application history
  - learning history

The settings experience should be simple enough for onboarding, but the model should support richer tuning later.

## Core Mentor Capabilities

The Mentor feature should be decomposed into smaller capabilities, not implemented as one large prompt or one large service.

### 1. Mentor Onboarding

Purpose:
- activate Mentor after resume upload
- create or initialize the mentor profile
- let the user choose default or custom mentor settings

Outputs:
- mentor profile
- first assessment trigger

### 2. Resume Assessment

Purpose:
- understand what the user currently offers

Responsibilities:
- identify current strengths
- identify weak or missing signals
- summarize probable market readiness

Outputs:
- resume assessment summary
- strengths
- weak points

### 3. Opportunity Assessment

Purpose:
- compare the user against available jobs

Responsibilities:
- filter jobs using mentor settings
- score job viability
- explain fit and non-fit
- generate coaching notes

Outputs:
- shortlist of viable jobs
- fit explanations
- coaching notes
- apply now vs not yet classification

### 4. Gap Analysis

Purpose:
- identify what is blocking the user from better opportunities

Responsibilities:
- detect missing skills
- detect recurring weak signals
- separate hard blockers from improvements
- prioritize gaps according to user strategy

Outputs:
- prioritized gap list
- recurring themes across jobs
- urgency level

### 5. Learning Guidance

Purpose:
- help the user improve, not just diagnose gaps

Responsibilities:
- name important gaps
- suggest learning resources
- connect learning to target jobs
- track whether a skill is being learned or is resume-ready

Outputs:
- suggested resources
- learning priorities
- skill-readiness progression

### 6. Weekly Action Planning

Purpose:
- convert mentor analysis into concrete action

Responsibilities:
- choose what to apply for now
- choose what to study now
- balance short-term applications and skill-building

Outputs:
- weekly action plan
- job application targets
- study targets
- mentor follow-up prompts

### 7. Mentor Memory

Purpose:
- make the mentor persistent over time

MVP memory should track:
- rejected applications
- what the user already studied
- advice previously given
- advice ignored
- improvements over time

Later memory may also track:
- successful applications
- interview quality patterns
- confidence trends
- recurring motivation issues

## Architectural Style

Mentor should follow the repository-wide architecture rules defined in [ARCHITECTURE.md](../ARCHITECTURE.md).

That means:

- functional domain core
- typed ports for external dependencies
- thin adapters
- no inheritance
- minimal hidden state

Mentor should not become a giant class or a giant prompt.

## Mentor Domain Architecture

The domain layer should contain the rules and reasoning that define what the Mentor means.

This logic should be implemented as plain typed functions where possible.

Examples of domain responsibilities:

- normalize mentor preferences
- derive strategy weighting
- rank viable opportunities
- identify recurring skill gaps
- classify job readiness
- summarize mentor memory
- generate weekly plan structure
- determine whether advice should be repeated or escalated

Domain code should:

- accept plain typed inputs
- return plain typed outputs
- avoid network calls
- avoid database access
- avoid SDK imports

## Mentor Ports

Mentor should consume the rest of the application through explicit ports.

Likely outbound ports:

- `IResumeRepositoryPort`
  - fetches the current resume or resume summary
- `IJobOpportunityPort`
  - provides available job openings for mentor evaluation
- `IApplicationRepositoryPort`
  - provides application history and outcomes
- `IMentorAnalysisPort`
  - wraps LLM-based mentor reasoning where needed
- `IMentorMemoryPort`
  - stores and retrieves mentor-specific memory
- `ILearningResourcePort`
  - provides suggested learning resources

Not all of these must exist on day one, but the architecture should allow them.

## Mentor Adapters

Adapters should stay thin and translate between external systems and Mentor-safe domain types.

Examples:

- Supabase-backed mentor memory adapter
- job-source adapter that reads scraped jobs
- OpenAI mentor analysis adapter
- learning resource lookup adapter

Adapters should:

- handle I/O
- map failures into typed error results
- call domain logic

Adapters should not:

- own business rules
- hide ranking logic
- make product decisions implicitly

## Mentor Use Cases

The Mentor feature should be implemented as multiple use cases, not a single mega-use-case.

Recommended use cases:

### `InitializeMentorUseCase`

Purpose:
- create mentor state after resume upload

Inputs:
- user id
- resume id or resolved resume summary
- optional settings

Outputs:
- mentor profile initialized
- first assessment scheduled or triggered

### `AssessMentorReadinessUseCase`

Purpose:
- build a current snapshot of the user's position

Inputs:
- resume
- mentor settings
- job opportunities
- application history
- mentor memory

Outputs:
- strengths
- weaknesses
- readiness summary
- key blockers

### `GenerateMentorShortlistUseCase`

Purpose:
- produce the MVP centerpiece

Inputs:
- resume
- settings
- jobs
- readiness context

Outputs:
- shortlist of viable jobs
- coaching note per job
- apply-now recommendations

### `GenerateSkillGapPlanUseCase`

Purpose:
- turn opportunity analysis into learning direction

Inputs:
- jobs
- resume
- mentor memory
- strategy mode

Outputs:
- prioritized gaps
- resource suggestions
- study priorities

### `GenerateWeeklyMentorPlanUseCase`

Purpose:
- produce short-cycle next actions

Inputs:
- shortlist
- gap plan
- memory
- strategy mode

Outputs:
- weekly apply goals
- weekly learning goals
- follow-up prompts

### `UpdateMentorMemoryUseCase`

Purpose:
- store new outcomes and progress

Inputs:
- application outcomes
- learning updates
- advice acceptance or rejection

Outputs:
- updated mentor memory

## Recommended Domain Models

The exact file names may change, but the feature needs clear models.

### `MentorProfile`

Contains:
- user id
- strategy mode
- tone
- opinion strength
- target roles
- geography preferences
- industry preferences
- ranking weights

### `MentorAssessment`

Contains:
- assessed at timestamp
- strengths
- weaknesses
- viable role summary
- key blockers
- readiness narrative

### `MentoredOpportunity`

Contains:
- job reference
- fit score
- fit reasons
- non-fit reasons
- apply now flag
- coaching note
- suggested resume emphasis

### `MentorGap`

Contains:
- skill or signal name
- severity
- frequency across jobs
- why it matters
- recommended response

### `MentorActionPlan`

Contains:
- week start
- applications to prioritize
- learning tasks
- suggested resources
- mentor reminders

### `MentorMemory`

Contains:
- previous advice
- ignored advice
- studied skills
- rejection patterns
- improvement log

## Ranking Strategy

Mentor should not use one fixed evaluation mode for all users.

Evaluation should be shaped by:

- strategy mode
- ranking weights
- tone and opinion setting
- actual job-market evidence

For example:

- "get hired quickly" should weight immediate viability more heavily
- "long-term growth" should weight stretch opportunities and skill-building more heavily
- "balanced" should sit in between

This is a product-level rule, not just a UI preference.

## MVP Delivery Order

To avoid overbuilding, the Mentor feature should be delivered in slices.

Recommended order:

1. mentor settings and profile
2. mentor initialization after resume upload
3. mentor shortlist generation
4. coaching notes per job
5. gap analysis
6. weekly action plan
7. mentor memory updates from outcomes and study progress

This keeps the MVP centered on one strong workflow rather than attempting full coaching from day one.

## Risks

Key risks for the feature:

- Mentor becomes a generic chat assistant instead of a structured coach
- outputs are too vague to be actionable
- memory is too weak to feel persistent
- settings are too complex during onboarding
- job scoring is not trustworthy
- learning advice is too broad and gets ignored

The feature should bias toward:

- structured outputs
- evidence-based recommendations
- clear boundaries with the rest of the product

## Final Rule

Mentor is a feature inside a bigger product.

It should consume resume, jobs, applications, and settings through explicit boundaries.
It should own the coaching logic, prioritization logic, and memory behavior.

The MVP expression of Mentor is:

> A persistent career mentor that activates after resume upload, evaluates the user against real job opportunities, explains strengths and gaps, recommends what to do next, and adapts over time based on outcomes, learning progress, and user preferences.
