# MCP Evaluation for CeeVee

## Purpose

This document evaluates whether an MCP server is a strong architectural fit for this product in its current form.

The goal is not to argue that MCP is always bad.
The goal is to evaluate whether MCP adds enough value here to justify the extra layer.

## Short Conclusion

For this project, MCP currently appears to provide limited benefit compared to a conventional backend API.

The main reason is that the product flow is shaped as a controlled backend pipeline, not as a set of independent agent tools that should be freely orchestrated by an LLM.

Because of that:

- the primary system boundary should likely remain a conventional backend interface
- orchestration should stay inside backend use cases
- MCP would be, at best, an internal or development-facing adapter, not the main product boundary

## Project Context

Based on the existing project documents:

- the repo follows a functional core, typed ports, thin adapters architecture
- use cases are responsible for orchestration
- adapters should stay thin and should not own business logic
- the product is intended to become a paid application

These constraints matter when evaluating MCP.

## The Proposed MCP Shape

The proposed MCP server exposes these tools:

- `discover_companies(prompt)`
- `scrape_career_page(url)`
- `match_resume(job_id, resume_id)`
- `log_application(job_id, resume_id)`
- `get_application_insights(job_id)`

At first glance, these look like agent tools.
But in this product they do not behave like fully independent capabilities.

They are closer to backend pipeline stages with ordering constraints and data dependencies between them.

## Main Architectural Concern

If these operations must run in a meaningful sequence, exposing them as freely callable MCP tools creates an avoidable risk.

The risk is that orchestration responsibility shifts from backend use cases to the LLM.

That would be a weak fit for this repo because:

- use cases are supposed to orchestrate flow
- adapters are supposed to stay thin
- business sequencing should not live inside prompt behavior

If the tool order is important, then the safe design is:

- keep the low-level operations inside the backend
- connect them through use cases
- expose a higher-level business operation if agent access is needed

In other words, the current five operations look more like internal application steps than external MCP-facing capabilities.

## Why REST Already Covers the Main Need

This project already uses a hexagonal architecture.

That means the system is already structured so that:

- domain logic is isolated
- use cases define application behavior
- ports define boundaries
- adapters can expose the same use case through different interfaces

Because of that, a conventional REST API already solves the main integration problem:

- a frontend can call backend use cases
- auth and billing can stay at the backend boundary
- orchestration can remain controlled and deterministic

MCP is not needed to make the codebase modular.
The architecture already does that.

## What MCP Adds in General

MCP can be useful when:

- an LLM should discover tools dynamically
- the LLM should choose among multiple independent capabilities
- different agent clients should share the same tool interface
- the product is truly agent-first at the tool boundary

Those are real benefits.

## Why Those Benefits Look Weak Here

In this product, the expected workflow appears to be constrained rather than open-ended.

The main limitations are:

- the steps are not fully independent
- the order of execution matters
- incorrect sequencing can break the pipeline
- a paid product needs strong control over access and usage

Because of that, the main benefits of MCP do not appear to outweigh the added complexity.

## Paid Product Concern

This product is expected to be something users pay for.

That makes the external system boundary more sensitive.

A paid product usually needs:

- authentication
- authorization
- subscription checks
- billing or usage tracking
- rate limiting
- clear access control

A conventional backend API is a more natural place to enforce those concerns.

Exposing product capabilities outward as MCP tools would make the external boundary less controlled and potentially more awkward to secure and monetize.

For that reason, MCP does not look like a strong primary public interface for this product.

## Internal MCP vs External MCP

There is still a weaker but valid case for internal MCP.

Internally, MCP could be useful as:

- a development-facing tool interface
- a local integration surface for LLM CLIs
- a standard internal bridge between an agent and backend capabilities

But even in that case, MCP should likely expose higher-level orchestrated operations rather than raw pipeline stages.

So the distinction matters:

- external paid product boundary: REST is likely stronger
- internal developer or agent tooling boundary: MCP can still be acceptable

## Recommended Direction

For this project, the stronger default appears to be:

1. keep the main product boundary as a conventional backend API
2. keep sequencing inside use cases
3. treat the five proposed operations as internal application capabilities
4. only add MCP if there is a clear internal agent use case that benefits from it
5. if MCP is added, expose higher-level orchestrated tools instead of fragile low-level pipeline steps

## Final Assessment

MCP is not inherently wrong for this project.

However, in the current product shape it does not appear to provide enough benefit to justify becoming the main interface.

The architecture already has clean boundaries through ports, adapters, and use cases.
The workflow appears pipeline-driven rather than tool-driven.
The product also needs a strong paid-service boundary.

Because of that, MCP currently looks like an optional internal adapter, not a core architectural requirement.

## Cases Where MCP Could Still Be Strong in This Project

The current MCP proposal looks weak.
However, there are still some cases where MCP could become a genuinely strong fit for this repo.

Those cases require a different role for MCP than the current one.

### 1. Internal agent tooling for developers

MCP can make sense if the goal is to let contributors connect local LLM CLIs to the system during development.

In that case, MCP acts as:

- a standard local tool surface
- a fast way to test agent-driven workflows
- a reusable developer integration instead of custom one-off scripts

This is strongest when the audience is the team, not paying end users.

### 2. A stable interface for multiple internal agent clients

MCP becomes more valuable if the project expects more than one internal agent consumer, for example:

- one CLI workflow for engineering
- one mentor-focused internal assistant
- one evaluation or testing agent
- one future automation worker

In that situation, MCP provides one shared tool contract instead of each client inventing its own REST calling logic.

### 3. Higher-level orchestrated tools instead of raw pipeline steps

MCP can be a good fit if the exposed tools are redesigned at the right abstraction level.

For example, an MCP server would be much stronger if it exposed:

- `run_opportunity_discovery_pipeline(...)`
- `generate_mentor_shortlist(...)`
- `create_skill_gap_plan(...)`

rather than exposing fragile internal stages one by one.

This would preserve backend orchestration while still giving an agent useful business-level capabilities.

### 4. Agent experimentation without changing the product API

If the team wants to experiment with agent behavior quickly, MCP can provide a useful sandbox layer.

That would allow:

- trying different LLM clients
- testing different prompting strategies
- comparing how agents use the same backend capability surface

without redesigning the main REST API every time.

This is valuable when the team is still learning what level of agent autonomy is actually useful.

### 5. Tool discoverability for non-frontend consumers

REST works well when a frontend already knows the flow.
MCP becomes more valuable when the consumer is not a frontend, but an agent that benefits from explicit tool schemas and descriptions.

This is strongest when:

- the caller is an LLM
- the caller should inspect available capabilities dynamically
- the team wants a more tool-native integration than ad hoc REST wrappers

In that case, MCP improves the agent integration experience, even if it does not replace the main backend boundary.

### 6. Controlled internal automation workflows

MCP could be useful if the team later builds internal automations such as:

- scheduled opportunity refreshes
- batch resume-job matching analysis
- mentor follow-up generation
- internal quality-review agents

If those automations are agent-driven, MCP can provide a cleaner tool layer than coupling those workers directly to REST and application internals.

### 7. Evaluation and benchmarking of agent behavior

If the team wants to measure how well an LLM uses product capabilities, MCP can become useful as a controlled evaluation interface.

That makes it easier to test:

- which tools the model selects
- whether it handles failures correctly
- whether it respects tool constraints
- whether one model behaves better than another on the same tool surface

This is a real benefit if agent quality itself becomes an engineering concern.

### 8. Future platform direction toward an internal agent operating system

MCP becomes more compelling if the long-term direction of the repo shifts from:

- a conventional web application with some AI features

to:

- an internal agent platform where multiple capabilities are intentionally exposed as reusable tools

If that strategic shift happens, MCP could become the right connective layer.

But that would be a future platform decision, not a requirement clearly justified by the current product shape.

## Final Nuance

So the strongest balanced conclusion is not:

- "MCP is useless here"

The stronger conclusion is:

- "MCP is weak as the current primary product boundary, but it could be strong as an internal developer or agent integration layer, especially if the exposed tools move to a higher orchestration level."
