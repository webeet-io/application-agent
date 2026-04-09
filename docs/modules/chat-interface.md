# Chat Interface Module

## Purpose

This document is the integration contract for the chat interface module implemented in this repository.

It is written primarily for LLM-based contributors that need to understand:

- what this module does
- how to call it
- what data it expects and returns
- which files belong to it
- where its boundaries are
- what must not be pushed into this module

This is not a task log and not a review checklist.

## Module Summary

The chat interface module provides one focused capability:

- accept a threaded chat history from the frontend
- request one assistant reply from an OpenAI-backed adapter
- return the assistant reply plus extracted source links
- render the conversation in the UI
- support browser voice input in the composer

At the current stage, this is a request-driven chat module.

It is not a persistent assistant, not a tracker, and not a mentor system.

## What This Module Owns

This module owns:

- the chat page UI
- local chat thread state in the browser
- browser voice input behavior for the chat composer
- the `/api/chat` delivery endpoint
- chat-specific application orchestration in `AskChatUseCase`
- the outbound assistant port
- the OpenAI chat adapter
- assistant reply parsing and source extraction
- clickable message-link rendering

## What This Module Does Not Own

Do not treat this module as the place for:

- persistent server-side conversation memory
- repository-backed chat history
- application-tracker state updates
- mentor preferences, mentor memory, or mentor follow-up behavior
- resume analysis pipelines
- multi-step domain workflows outside the chat request/reply cycle

If a future feature needs long-lived assistant memory, repository coordination, or cross-feature state updates, that should likely become a separate assistant/tracker boundary rather than an expansion of this module.

## Runtime Model

The runtime model is:

1. the browser holds the current message thread
2. the browser sends the thread to `/api/chat`
3. the route validates HTTP payload shape
4. the use case normalizes and guards the chat history
5. the use case calls the assistant port
6. the OpenAI adapter calls the Responses API
7. the adapter extracts assistant text and sources
8. the route returns a JSON payload
9. the frontend appends the assistant message locally

Important consequence:

- the backend does not persist chat history between requests
- the full active thread is sent by the client on each request

## Backend Contract

### HTTP Entry Point

- file: `apps/web/src/app/api/chat/route.ts`
- method: `POST`
- path: `/api/chat`

### Request Shape

```ts
{
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
  }>
}
```

HTTP-level validation enforces:

- `messages` exists
- `messages` contains at least one item
- each item has `id`
- each item has `role`
- each item has non-empty `content`

### Use-Case-Level Guardrails

After HTTP validation, the chat use case applies module-level orchestration rules:

- trims message content
- removes blank messages that become empty after trimming
- forwards only the latest configured history window
- requires the latest message to be from the user
- maps adapter failures into chat-level errors

Current history cap:

- `20` messages

### Success Response

```ts
{
  reply: string
  sources: Array<{
    title: string
    url: string
  }>
}
```

### Error Response

```ts
{
  error: string
}
```

Current error categories at the use-case boundary are:

- invalid chat history
- assistant unavailable
- empty assistant reply

The route converts these into HTTP responses.

## Frontend Contract

### UI Entry

- file: `apps/web/src/app/page.tsx`
- main component: `ChatInterface`

### Frontend Responsibilities

The frontend chat module:

- renders user and assistant messages
- renders assistant sources under assistant replies
- keeps the thread in local React state
- sends the full thread to `/api/chat`
- renders clickable markdown links and raw URLs
- supports typed input and browser speech input
- shows sending state and failure state

### Voice Input

Voice input is browser-based and lives entirely on the frontend side of this module.

It currently provides:

- microphone toggle button
- repeated dictation across turns
- live meter visualization
- transcript insertion into the current composer value

This module does not perform server-side speech processing.

## Port and Adapter Boundary

### Port

- file: `apps/web/src/ports/outbound/IChatAssistantPort.ts`

The port defines what the chat application layer needs from an assistant provider:

- input: `ChatMessage[]`
- output: `Promise<AttemptResult<ChatAssistantError, ChatReply>>`

The port should stay provider-agnostic.

### Adapter

- file: `apps/web/src/adapters/llm/OpenAIChatAssistantAdapter.ts`

The adapter owns:

- OpenAI SDK integration
- Responses API invocation
- declaration of the `web_search` tool
- provider-specific payload translation
- extraction and deduplication of sources
- mapping runtime provider failures into typed adapter errors

The adapter must remain thin.

Do not move chat application rules into the adapter.

## Use Case Boundary

### File

- `apps/web/src/application/AskChatUseCase.ts`

### Responsibility

`AskChatUseCase` is the application action for:

- given a chat history, ask the assistant for one reply

Its job is orchestration, not provider integration and not UI behavior.

At the current stage it is responsible for:

- normalizing message history before the port call
- rejecting invalid request-level histories
- capping forwarded history
- translating adapter failures into chat-level feature errors

It must not own:

- OpenAI SDK calls
- source parsing
- browser state
- persistence
- tracker-style memory

## Domain Boundary

### File

- `apps/web/src/domain/chat.ts`

The domain file currently defines:

- `ChatRole`
- `ChatSource`
- `ChatMessage`
- `ChatReply`
- assistant instructions via `buildChatInstructions()`

This layer should stay plain and provider-free.

Do not add:

- SDK imports
- HTTP handling
- route logic
- React state
- repository logic

## Files That Belong to This Module

### Backend

- `apps/web/src/app/api/chat/route.ts`
- `apps/web/src/application/AskChatUseCase.ts`
- `apps/web/src/ports/outbound/IChatAssistantPort.ts`
- `apps/web/src/adapters/llm/OpenAIChatAssistantAdapter.ts`
- `apps/web/src/domain/chat.ts`
- `apps/web/src/infrastructure/container.ts`
- `apps/web/src/infrastructure/env.ts`

### Frontend

- `apps/web/src/app/page.tsx`
- `apps/web/src/modules/chat/components/chat-interface.tsx`
- `apps/web/src/modules/chat/hooks/use-chat-thread.ts`
- `apps/web/src/modules/chat/hooks/chat-thread-state.ts`
- `apps/web/src/modules/chat/hooks/use-voice-input.ts`
- `apps/web/src/modules/chat/lib/render-message-content.tsx`
- `apps/web/src/modules/chat/lib/parse-message-content.ts`
- `apps/web/src/modules/chat/types.ts`

### Tests

- `apps/web/src/app/api/chat/route.test.ts`
- `apps/web/src/application/AskChatUseCase.test.ts`
- `apps/web/src/modules/chat/hooks/chat-thread-state.test.ts`
- `apps/web/src/modules/chat/lib/parse-message-content.test.ts`

### Supporting Files

- `apps/web/vitest.config.ts`
- `scripts/with-root-env.sh`
- `scripts/start-dev.sh`
- `README.md`

## How To Integrate This Module

If another contributor or LLM needs to integrate this module into a larger system, follow these rules:

1. Use the existing route -> use case -> port -> adapter shape.
2. Keep HTTP parsing in the route only.
3. Keep chat orchestration in `AskChatUseCase`.
4. Keep provider-specific behavior in `OpenAIChatAssistantAdapter`.
5. Keep frontend thread state on the frontend unless a separate persistent assistant boundary is explicitly introduced.
6. Pass the full active thread to `/api/chat` on each request.
7. Treat returned `sources` as optional UI data attached to the assistant reply.

## Current Product Behavior

The module currently supports web-backed answers by making the `web_search` tool available to the model.

Important clarification:

- the UI does not expose a separate web-search toggle
- the adapter does not force every answer to use web search
- the model decides whether web search is needed based on the instructions and the request

This is the current intended behavior for the module.

## Constraints For Future Changes

When extending this module, preserve these constraints:

- do not introduce persistent chat memory here unless the product explicitly wants this module to become a stateful assistant boundary
- do not move provider logic into the route or domain
- do not move browser concerns into the backend
- do not use this module as a shortcut for tracker or mentor features
- do not turn the adapter into a business-logic service layer

If a new requirement does not fit these constraints, create or extend another boundary instead of overloading this module.

## Verification State

The module currently has:

- route tests
- use-case tests
- chat-thread-state tests
- message-content parsing tests
- passing `pnpm --filter web test`
- passing `pnpm typecheck`
- passing `pnpm lint`

## Short Integration Summary

Use this module when you need:

- a request-driven chat UI
- one assistant reply per request
- optional source-backed answers
- browser voice input in the composer

Do not use this module as if it were:

- a persistent assistant memory system
- an application tracker
- a mentor engine
- a repository-backed multi-turn orchestration system
