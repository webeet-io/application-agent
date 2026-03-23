# Interfaces

See also: [index.md](./index.md)

## Purpose

This document defines the primary architecture-level interfaces of CeeVee.

## Interface Categories

- Web-to-backend application interface
- MCP tool interface
- Port interfaces inside the domain
- External provider interfaces

## Web-To-Backend Interface

The web app communicates only with the backend service. The backend is the authoritative owner of:

- resume ingestion
- company discovery
- scraping orchestration
- opportunity ranking
- application tracking
- insights retrieval
- cover-letter scaffolding generation

The frontend contract should prefer task-oriented endpoints over low-level provider-shaped APIs.
Every backend-facing request must execute within an explicit user context, even in the single-user MVP.

## MCP Tool Interface

The backend exposes a stable MCP tool surface for agent-driven usage.
The MCP runtime is an integrated part of `apps/api`, not a separate business-logic stack.

Initial tools:

- `discover_companies(prompt)`
  Returns a candidate company list for a natural-language search prompt.

- `scrape_career_page(url)`
  Returns normalized job listings for a single career page.

- `match_resume(job_id, resume_id)`
  Returns a score, explanation, and recommendation for a job-resume pair.

- `log_application(job_id, resume_id)`
  Stores an application event and its current state.

- `get_application_insights()`
  Returns retrieval-backed patterns from prior applications.

## Interface Flow

```mermaid
sequenceDiagram
    participant User
    participant Web
    participant Backend
    participant MCP
    participant Adapters

    User->>Web: Enter prompt / upload resume / mark applied
    Web->>Backend: Task-oriented request
    Backend->>Adapters: Use ports through adapters
    Backend->>MCP: Expose same capability family as tools
```

Purpose:
This diagram shows how the same backend capability layer serves both the web app and MCP consumers.

What the reader should understand:
The MCP surface is not a separate business logic stack. It is another interface into the same backend capability set.

Why the diagram belongs here:
This file owns architecture-level interface boundaries and interface consumers.

## Port Contract Expectations

Every domain port should specify:

- purpose
- request and response shape
- validation expectations
- failure modes
- ownership
- compatibility expectations

The architecture-level definitions of the external-facing ports are maintained in [port-contracts.md](./port-contracts.md).

Transport-facing validation schemas should be defined once in shared contract definitions and reused across:

- HTTP request validation
- MCP tool input validation
- frontend form validation where appropriate

This keeps Web and MCP interfaces aligned while preserving domain isolation.

## Failure Behavior

Architecture-level interface behavior must distinguish between:

- user-visible validation errors
- temporary provider failures
- scraping extraction failures
- retrieval degradation
- missing resume or opportunity references

The backend should return stable, categorized failures rather than leaking provider-specific errors directly.

For long-running scraping or enrichment operations, the interface layer should prefer:

- accepted-job responses
- progress polling or status retrieval
- stable completion and failure states

## Evolution Expectations

- MCP tool names should remain stable once published
- web endpoints may evolve faster, but should remain task-oriented
- port interfaces may change only with explicit coordination across affected modules
- user-context handling should remain compatible when the project moves from single-user mode to Supabase Auth
