# Architecture Style Decision: Functional vs Object-Oriented TypeScript

## Context

Based on [VISION.md](/Users/shenmay/Projects_/Webeet-io/application-agent/VISION.md), this project is aiming for a clean domain-driven, hexagonal architecture with:

- clear ports and adapters
- shared domain types
- swappable infrastructure
- strong separation between core business logic and external systems such as HTTP, databases, and LLM providers

TypeScript supports both object-oriented and functional styles, but each pushes the architecture in different directions. This document evaluates both approaches in the context of this repo and concludes with a recommendation.

## Object-Oriented TypeScript in This Project

### Pros

- Maps naturally to hexagonal architecture when ports are modeled as interfaces and adapters as classes.
- Works well for stateful services such as scrapers, repositories, match engines, or MCP tool handlers.
- Dependency injection is straightforward, for example a `CompanyDiscoveryService` depending on `CompanyDiscoveryPort`.
- Familiar mental model for teams that think in terms of components with clear responsibilities.

### Cons

- Carries a high ceremony cost in TypeScript through interfaces, classes, constructors, and factories.
- Encourages hidden mutable state, which complicates scraping flows, matching pipelines, and RAG orchestration.
- TypeScript is structurally typed, so classic OOP guarantees are weaker than in Java or C#.
- Increases the risk of over-modeling too early, which slows iteration in a repo that is still largely scaffold plus vision.

## Functional TypeScript in This Project

### Pros

- Fits pipeline-style workflows well, such as:

```text
prompt
  -> companies
  -> career URLs
  -> jobs
  -> match scores
  -> ranked opportunities
```

- Keeps domain logic pure and testable, aligning with the vision that core business logic must not know about HTTP, databases, or LLM providers.
- Plays to TypeScript's strengths through discriminated unions, explicit data modeling, and small composable functions.
- Works especially well for deterministic transforms such as ATS detection, job normalization, score calculation, and recommendation generation.

### Cons

- Can feel fragmented if everything is "just functions" with no clear ownership boundaries.
- Stateful infrastructure code can feel awkward in a purely functional style, especially for DB clients, auth or session handling, and long-lived MCP servers.
- Teams unfamiliar with FP may struggle with composition-heavy code or functional error handling.
- Taken too far, FP can reinvent patterns that classes would have handled more simply.

## Functional Core, Object-Oriented Shell

The strongest fit for this repo is a functional core with an object-oriented shell.

### What This Means

- Functional domain core for matching logic, ranking and scoring, ATS detection, normalization, and recommendation rules.
- Thin adapter layer, optionally class-based, for Supabase repositories, LLM clients, scraper adapters, and MCP tool wiring.
- Heavy use of TypeScript types for domain models and port contracts.
- No inheritance.
- Prefer composition over service trees.

## Impact of AI-Assisted Development

If every team member is using AI to write code, the tradeoffs shift.

AI performs best when the codebase has:

- obvious, repeatable patterns
- small units with clear inputs and outputs
- minimal hidden state
- low architectural ambiguity

This strongly favors a functional domain core.

## Why Functional Is Stronger with AI in the Loop

### Pros

- Pure functions are easier for AI to generate correctly.
- Clear inputs and outputs improve AI-driven testing and refactoring.
- Domain rules stay explicit in types and signatures.
- There is less risk of tangled inheritance, unnecessary abstractions, or constructor-heavy code.
- Human review is easier because behavior is visible without tracing object lifecycles.

### Cons

- Without discipline, AI may generate too many loose helpers.
- The codebase still needs explicit module boundaries to avoid utility sprawl.
- Infrastructure code should not be forced into pure FP patterns where that adds friction.

## Why Heavy OOP Is Riskier with AI

### Pros

- Still useful at system boundaries.
- Works well if patterns are tightly constrained and well documented.

### Cons

- AI tends to overproduce classes, interfaces, service layers, and factories.
- Hidden mutable state makes AI-generated bugs harder to detect.
- AI often imitates Java or C# patterns that are too verbose for TypeScript.
- Class hierarchies are easy to bloat and hard to unwind.

## What Is Easier for LLMs

For LLM-assisted development specifically, functional TypeScript is usually easier than object-oriented TypeScript.

### Why Functional Is Easier for LLMs

- Functions have clearer boundaries: input in, output out.
- Pure logic is easier for the model to generate without breaking unrelated behavior.
- There is less hidden state to track across methods, constructors, and object lifecycles.
- Function signatures and types give the model a direct contract to follow.
- Small composable modules are easier for an LLM to edit safely than large service classes.

### Why OOP Is Harder for LLMs

- The model has to infer class relationships, lifecycle, and side effects.
- It is easier for the model to invent unnecessary abstractions such as `BaseService`, `AbstractRepository`, or layered managers.
- Bugs are harder to spot when behavior depends on internal mutable state.
- In TypeScript, LLMs often generate Java-style class structures that look organized but add little value.

### For This Project Specifically

- LLM tasks such as ATS detection, job normalization, ranking, matching, and recommendation logic are much easier as typed functions.
- Boundary code such as Supabase access, scraper clients, or MCP adapters can still use simple classes or object-based adapters if needed.

### Practical Rule

- Easier for LLMs: functional core
- Acceptable at boundaries: light OOP
- Hardest for LLMs to keep clean: deep class-heavy architecture

A good rule for this repo:

- If it is business logic, write a function.
- If it wraps an external system, use a thin adapter.
- If a class does not manage a real boundary, it probably should not be a class.

## Concrete Recommendations for This Repo

- Functional domain core
- Thin adapter layer
- Very limited OOP

### Concretely

- Use functions for match scoring, ATS detection, job normalization, ranking, recommendation logic, and RAG retrieval orchestration.
- Use plain objects and TypeScript types for domain models and port contracts.
- Use classes only when they clearly help at boundaries, such as `SupabaseApplicationRepository` or `OpenAICompanyDiscoveryAdapter`.
- Avoid inheritance entirely.
- Prefer composition over service trees.

## Conclusion

For this project's goals, clean separation, swapability, testability, and fast iteration, functional TypeScript is the better default.

Object-oriented code should exist only where it improves clarity at the boundaries. A class-heavy OOP architecture would add ceremony, increase AI-generated bloat, and make debugging harder without providing proportional benefits in TypeScript.

Final recommendation:

> Build this repo as a functional core with typed ports and thin adapters, and keep any object-oriented code minimal, explicit, and confined to infrastructure boundaries.
