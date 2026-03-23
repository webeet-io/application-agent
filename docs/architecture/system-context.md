# System Context

See also: [index.md](./index.md)

## Purpose

This document defines the actors, system boundary, and major interaction flows around CeeVee.

## Actors

- User
  Uploads resume versions, describes search intent, reviews opportunities, tracks applications, and reviews insights.

- CeeVee Web App
  The user-facing product surface for resume management, discovery, review, tracking, and insight presentation.

- CeeVee Backend
  Executes discovery, scraping, matching, retrieval, persistence, and MCP tool exposure.

- LLM Provider
  Supports company discovery, reasoning support, recommendation generation, and cover-letter scaffolding.

- Career Page / ATS Providers
  Source of job listings. Initial adapter family targets Greenhouse, Lever, Workday, and Ashby.

- Supabase
  Provides Postgres storage, vector storage through pgvector, object storage, and a future-compatible auth boundary.

- User Context Boundary
  Represents the identity and access scope attached to backend and MCP requests, even in the initial single-user MVP.

## System Boundary

```mermaid
flowchart TD
    User --> Web[CeeVee Web App]
    Web --> Backend[CeeVee Backend]
    Backend --> Supabase[Supabase Postgres + pgvector]
    Backend --> ATS[Greenhouse / Lever / Workday / Ashby]
    Backend --> LLM[LLM Provider]
    Backend --> MCP[MCP Clients]
```

Purpose:
This diagram identifies the system boundary and the major external dependencies.

What the reader should understand:
All non-trivial integrations are owned by the backend, while the web app remains the user-facing layer.

Why the diagram belongs here:
System boundary and actor relationships are a context concern.

## Primary User Flows

### Resume and opportunity flow

1. User uploads one or more resume versions
2. User enters a natural-language job search prompt
3. Backend discovers candidate companies
4. Backend scrapes career pages and normalizes job listings
5. Backend scores jobs against one or more resume versions
6. Web app displays ranked opportunities with explanations and recommendations

### Application tracking flow

1. User marks a job as applied
2. User records outcomes over time
3. Backend stores application history
4. Retrieval uses that history for future scoring and insight generation

### User context flow

1. A web or MCP request enters the backend
2. The backend resolves a user context
3. Domain and application services execute within that context
4. Persistence and retrieval remain scoped to that context

### Skill and cover-letter assistance flow

1. User maintains a skill section and resume versions
2. Backend retrieves relevant resume chunks and opportunity context
3. Backend suggests relevant resume updates
4. Backend creates cover-letter scaffolding and learning backlog suggestions

## Key Context Constraints

- The MVP is single-user by design
- The MVP still requires an explicit user context boundary at backend-facing interfaces
- The system does not auto-apply
- LinkedIn and Xing scraping are intentionally out of scope
- Scraping quality depends on external site structure and ATS behavior
- Retrieval quality depends on data preparation and stored history quality

## Context Risks

- External ATS structure can change without notice
- Some scraping flows may be too slow for a fully synchronous request cycle
- An unclear identity boundary would create avoidable future interface breakage
- LLM-backed discovery and reasoning can drift without traceable inputs
- Resume and application data are sensitive and should remain tightly scoped
