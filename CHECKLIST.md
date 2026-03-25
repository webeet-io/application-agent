# Code Review Checklist

Use this file to validate code before pushing.
Instruction for AI: review the code against every rule in the relevant section(s) and flag any violation.

---

## Domain (`src/domain/`)

- [ ] Only plain types and pure functions — no classes
- [ ] No `async`, no `await`, no `fetch`, no SDK imports
- [ ] No imports from `adapters/`, `infrastructure/`, or any third-party SDK
- [ ] May only import from `@ceevee/types` or other files within `domain/`
- [ ] Functions return plain values — never `AttemptResult`
- [ ] No shared mutable state

---

## Ports (`src/ports/outbound/`)

- [ ] Contains only TypeScript interfaces and types — no implementation code
- [ ] Every port method that can fail returns `Promise<AttemptResult<E, T>>`
- [ ] Error type `E` is a discriminated union (e.g. `{ type: 'timeout' } | { type: 'parse_failed' }`) — not a generic `Error`
- [ ] May only import from `@ceevee/types` and `domain/`

---

## Adapters (`src/adapters/`)

- [ ] Implements exactly one port interface (`implements IXxxPort`)
- [ ] Returns `AttemptResult` — never throws for expected runtime failures
- [ ] External errors (SDK exceptions, HTTP failures) are caught and mapped to the port's typed error union
- [ ] No business logic — only translates between external format and domain types
- [ ] No imports from `application/` or other adapters
- [ ] No inheritance

---

## Use Cases (`src/application/`)

- [ ] Returns `Promise<AttemptResult<E, T>>`
- [ ] Only imports from `ports/` and `domain/` — never from `adapters/` or SDKs directly
- [ ] No business logic beyond orchestration (fetching, combining, delegating)
- [ ] One file per use case

---

## Infrastructure (`src/infrastructure/container.ts`)

- [ ] The only file in the codebase that instantiates adapters
- [ ] Exports use case instances — not adapter instances
- [ ] No business logic

---

## Route Handlers (`src/app/api/`)

- [ ] Imports use cases only from `infrastructure/container.ts`
- [ ] No business logic — parses request, calls one use case, returns response
- [ ] Input validation limited to HTTP-level checks (presence, type) — not business rules
- [ ] Handles `AttemptResult` from use case and maps to appropriate HTTP status code

---

## General

- [ ] No inheritance anywhere in the codebase
- [ ] No abstract base classes
- [ ] No class that doesn't manage real state or a real boundary (use a function instead)
- [ ] No broad utility files — helpers live close to where they are used
- [ ] `AttemptResult` is used at adapter and use case boundaries only — not inside domain functions
- [ ] New environment variables are accessed through `infrastructure/env.ts` — not via `process.env` directly
