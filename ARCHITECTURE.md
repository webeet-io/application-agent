# ARCHITECTURE

This document is the implementation guide for this repository.

It is not a product vision document. It is the architectural instruction that human contributors and LLM-based coding agents are expected to follow when adding or changing code in this repo.

The purpose of this file is to keep the codebase consistent, testable, and easy to evolve while multiple contributors, including AI systems, work in parallel.

## Purpose

This repository should be built as a smart job opportunity agent with:

- a functional domain core
- typed ports between the domain and external systems
- thin adapters around infrastructure
- minimal hidden state
- minimal architectural ambiguity

The system should be easy to extend, easy to test, and easy for both humans and LLMs to modify safely.

## Primary Architectural Decision

The default style for this repository is:

> Functional core, typed ports, thin adapters, minimal OOP.

That means:

- business logic should be implemented as functions
- domain behavior should operate on plain typed data
- external systems should be isolated behind explicit ports
- adapters may use lightweight classes or object wrappers when useful
- inheritance should not be used

## Why This Decision Exists

This repo is expected to be developed with significant LLM assistance. That changes what "good architecture" means in practice.

LLMs perform better when the codebase has:

- obvious patterns
- local reasoning boundaries
- explicit inputs and outputs
- low hidden state
- minimal ceremony

LLMs perform worse when the codebase relies heavily on:

- deep class hierarchies
- mutable service objects
- implicit control flow
- over-abstracted dependency injection trees
- Java-style architecture translated into TypeScript

Because of that, this repo should optimize for:

- readable functions
- explicit types
- composable modules
- infrastructure isolation
- deterministic domain code

## What Goes in the Functional Core

The functional core contains domain logic that should be deterministic, composable, and easy to test.

Examples include:

- company discovery result shaping
- ATS provider detection
- job listing normalization
- resume-to-job matching
- scoring and ranking
- recommendation generation
- application insight rules
- retrieval orchestration logic for RAG flows

These parts of the system should usually:

- accept plain typed inputs
- return plain typed outputs
- avoid network access
- avoid direct database access
- avoid direct SDK calls
- avoid mutating shared state

When possible, domain functions should be pure.

## What Goes in the Adapter Layer

The adapter layer is where the system talks to the outside world.

Examples include:

- Supabase repositories
- OpenAI clients
- career page scraping clients
- MCP server tool registration
- HTTP handlers
- auth and session integration
- file storage integration

Adapter code may be stateful if necessary, but it should stay thin.

Adapters are responsible for:

- translating between external APIs and internal domain types
- handling side effects
- calling the domain layer
- returning domain-safe outputs

Adapters are not responsible for:

- owning business rules
- embedding hidden decision logic
- becoming large service layers

## Port and Adapter Rules

All external dependencies should be hidden behind explicit ports.

A port is a TypeScript type or interface that defines what the domain needs, not how the dependency works internally.

Examples:

- `ICompanyDiscoveryPort`
- `ICareerPagePort`
- `IMatchEnginePort`
- `IApplicationRepositoryPort`

Rules:

- ports belong close to the domain
- adapters implement the ports
- the domain must not import adapter implementation details
- swapping infrastructure should not require rewriting domain logic

If a change forces domain code to know about a provider SDK, the design is drifting in the wrong direction.

## TypeScript Style Rules

TypeScript should be used as a modeling tool, not just a linted version of JavaScript.

Prefer:

- plain objects
- discriminated unions
- narrow domain types
- explicit function signatures
- small modules with obvious responsibilities

Avoid by default:

- inheritance
- abstract base classes
- generic service containers
- broad "utils" files
- classes that mostly forward to other classes

Use classes only when they clearly improve a boundary integration, for example:

- `SupabaseApplicationRepository`
- `OpenAICompanyDiscoveryAdapter`

Even then:

- keep the class thin
- keep constructor dependencies explicit
- keep business logic out of methods when possible

## OOP Guidance

Object-oriented code is allowed, but it is not the default.

Acceptable uses of OOP:

- wrapping an SDK client
- representing a repository implementation
- encapsulating stateful connection concerns
- exposing a clear adapter boundary

Unacceptable uses of OOP:

- creating deep inheritance trees
- introducing base services for consistency alone
- modeling every concept as a class
- spreading business rules across mutable instance methods

If a class does not manage a real boundary or real state, it probably should be a function or a plain object.

## Functional Guidance

Functional style is preferred for domain logic because it is easier to reason about, easier to test, and easier for LLMs to modify safely.

Good patterns:

- data in, data out
- stateless transformations
- explicit return values
- small composition-friendly helpers
- one module per clear domain responsibility

Bad patterns:

- large grab-bag helper files
- implicit shared state
- long pipelines with unclear intermediate types
- overly clever functional abstractions that reduce readability

This is not a "pure FP" codebase. Pragmatism matters more than ideology.

## Error Handling

This repo uses `AttemptResult<E, T>` — a native TypeScript discriminated union — for explicit error handling. There are no external result-type libraries.

```typescript
type AttemptResult<E extends Error | null, T> =
  | { success: true; error: null; value: T }
  | { success: false; error: E; value: null }
```

This type lives in `packages/types` and is available to all apps.

### Where to use it

- **Adapters** return `Promise<AttemptResult<E, T>>`. LLM failures, scrape timeouts, and database errors are runtime failures the application layer must handle explicitly.
- **Use cases** return `Promise<AttemptResult<E, T>>` so that the delivery layer (API routes, MCP tools) can decide on the response without containing business logic.
- **Domain functions** return plain values and throw on programming errors (wrong input type, violated invariant). Do not use `AttemptResult` in pure domain logic.

```typescript
// Domain: plain return, no AttemptResult
function calculateMatchScore(job: Job, resume: Resume): MatchScore { ... }

// Adapter: AttemptResult for runtime I/O failures
async function scrapeCareerPage(url: string): Promise<AttemptResult<ScraperError, JobListing[]>> { ... }

// Usage pattern
const result = await scrapeCareerPage(url)
if (!result.success) return result
doSomethingWith(result.value)
```

### Error types

Define errors as discriminated unions close to the port they belong to. Do not use generic `Error` objects for business-level failures.

```typescript
type ScraperError =
  | { type: 'timeout'; url: string }
  | { type: 'ats_not_supported'; ats: string }
  | { type: 'parse_failure'; reason: string }
```

### Why not neverthrow

Railway Oriented Programming (ROP) with `.andThen()` chaining looks appealing for pipelines but is the wrong fit here:

- Use cases are short (2–3 steps). `if (!result.success) return result` is more readable at this length.
- The scraper needs partial success: if 3 of 10 companies fail to scrape, return the 7 that succeeded. ROP models all-or-nothing and does not fit this pattern.
- `ResultAsync` vs `Result` distinctions in neverthrow are a stumbling block for beginners and produce inconsistent AI-generated code.

## LLM-Specific Contribution Rules

This section exists specifically for coding agents and human contributors using AI tools.

When generating or editing code in this repo:

- prefer functions over classes for business logic
- do not introduce inheritance
- do not create new abstractions unless they remove real duplication or clarify a boundary
- keep modules small and locally understandable
- make data flow explicit
- preserve clear naming between domain concepts and infrastructure concepts
- do not hide business rules inside framework glue
- do not move logic into a class just to appear "architectural"

LLMs should avoid generating:

- `BaseService`
- `AbstractRepository`
- multi-layer service managers
- empty wrapper classes
- large dependency injection scaffolds
- framework-driven indirection without clear value

LLMs should favor generating:

- typed domain functions
- explicit ports
- thin adapters
- small transformation modules
- focused tests around domain behavior

## Folder Structure

```
apps/web/src/
  domain/              ← Pure domain types and functions. No I/O, no SDK imports.
    entities/          ← Plain typed data models. Prefer interfaces over classes.
    value-objects/     ← Typed value objects (MatchScore, etc.)

  ports/               ← TypeScript interfaces only. No implementation code.
    outbound/          ← Contracts the application depends on (IMatchEnginePort, etc.)

  adapters/            ← Implementations of ports. May be stateful. Return AttemptResult.
    db/                ← Supabase repository adapters
    llm/               ← LLM adapters (OpenAI, etc.)
    career-pages/      ← Career page adapters (scraping + ATS API calls)
    embedding/         ← Embedding adapters

  application/         ← Use cases. Orchestrates domain + ports. One file per use case.

  infrastructure/      ← DI wiring and environment config. Not business logic.
    container.ts       ← Instantiates adapters and use cases. Imported by route handlers.
    env.ts             ← Environment variable access

  app/                 ← Next.js App Router. Delivery layer only.
    api/               ← Route handlers. Call a use case, return a response. No logic.

packages/types/        ← Shared branded types and AttemptResult used across apps.
```

### Rules per layer

| Layer | May import from | Must not import from |
|---|---|---|
| `domain/` | `packages/types` | `adapters`, `infrastructure`, any SDK |
| `ports/` | `packages/types`, `domain` | implementation code |
| `adapters/` | `ports`, `packages/types`, SDKs | other adapters |
| `application/` | `ports`, `domain`, `packages/types` | SDKs directly |
| `app/api/` | `infrastructure/container` | adapters, domain, use cases directly |
| `infrastructure/container.ts` | everything | — |

## Decision Checklist

Before adding a new file or abstraction, ask:

1. Is this business logic or infrastructure code?
2. If it is business logic, can it be a pure or mostly pure function?
3. If it touches an external system, should it live behind a port?
4. Am I introducing a class because it is truly useful, or because it feels conventional?
5. Will this be easy for another engineer or LLM to understand in one pass?

If the answer to the last question is no, simplify the design.

## Application Tracker

The Application Tracker is the most stateful part of the system. It maintains conversation history across multiple LLM turns and updates application state based on natural language input.

Architectural placement:

- Conversation state belongs in the adapter layer (`OpenAIApplicationAssistantAdapter`), not in the domain.
- The domain defines what an application update looks like — plain typed data.
- The use case (`ApplicationAssistantUseCase`) coordinates between the conversation adapter and the repository.

The tracker does not belong in the domain core because it is not a deterministic transformation — it is a stateful, multi-turn orchestration concern. Build it last, once the team has established patterns on the simpler parts of the system.

## MCP Architecture

The MCP server is a delivery layer, not a logic layer. It exposes use cases as tools.

Rules:

- MCP tools map 1:1 to use cases. A tool calls a use case and returns the result. Nothing more.
- MCP tool handlers must not contain business logic.
- MCP tools import from `infrastructure/container.ts` the same way API routes do.
- The domain, ports, and adapters are unaware of MCP. Swapping from HTTP to MCP changes only the delivery layer.

```typescript
// MCP tool — thin wrapper, no logic
server.tool('match_resume', async ({ jobId, resumeId }) => {
  const result = await matchResumeUseCase.execute(jobId, resumeId)
  if (!result.success) return { error: result.error.message }
  return result.value
})
```

## Default Rule of Thumb

Use this rule unless there is a strong reason not to:

- If it is business logic, write a function.
- If it wraps an external system, write a thin adapter.
- If it needs shared behavior, prefer composition.
- If a class is not managing a real boundary, do not create it.

## Final Guidance

This repo should not become a class-heavy enterprise TypeScript codebase.

It should become a clear, typed, modular system where:

- domain logic is easy to test
- infrastructure is easy to replace
- contributors can work in parallel without confusion
- LLM-generated code remains readable and correctable

The architectural default is therefore:

> Functional core with typed ports and thin adapters.
