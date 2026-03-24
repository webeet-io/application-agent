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

- `CompanyDiscoveryPort`
- `CareerPageScraperPort`
- `MatchEnginePort`
- `ApplicationRepositoryPort`

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

## Folder Intent

The exact folder structure may evolve, but the intended responsibility split is:

- `apps/` for application entry points and delivery layers
- `packages/types/` for shared domain-safe types
- domain-oriented modules for business rules
- infrastructure-oriented modules for adapters and integration code

A good future structure would separate:

- domain
- ports
- adapters
- transport or delivery
- shared types

The important part is not the exact folder names. The important part is preserving the boundary between domain logic and infrastructure.

## Decision Checklist

Before adding a new file or abstraction, ask:

1. Is this business logic or infrastructure code?
2. If it is business logic, can it be a pure or mostly pure function?
3. If it touches an external system, should it live behind a port?
4. Am I introducing a class because it is truly useful, or because it feels conventional?
5. Will this be easy for another engineer or LLM to understand in one pass?

If the answer to the last question is no, simplify the design.

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
