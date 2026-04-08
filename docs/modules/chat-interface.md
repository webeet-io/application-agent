# Chat Interface Module

## Purpose

This document describes the chat module implemented for the CeeVee / Application Agent chat interface work.

It exists to make the module boundaries explicit:

- what the chat module does
- what goes in the backend part of the module
- what goes in the frontend part of the module
- which parts belong to route, use case, port, and adapter
- what is already implemented
- what is still open and should be treated as TODO

## Task Source

The original GitHub issue is:

- Issue `#32` — `LLM Chat Interface`

Important note:

- the current GitHub issue body is empty
- the concrete task definition for this module therefore comes from the task brief used in the PR and implementation work

That task brief requires:

- a dedicated chat UI
- a backend `/api/chat` route connected to OpenAI
- source extraction for web-backed answers
- clickable links in assistant output
- voice input with live meter
- shared root `.env` loading
- startup scripts and README
- alignment with the repo architecture `route -> use case -> port -> adapter`

## Module Scope

This module is responsible for one concrete product capability:

- the user sends chat messages
- the application asks an assistant for a reply
- the assistant reply is rendered in the UI
- sources are shown when available
- the user may also dictate input through browser voice recognition

This module is **not** responsible for:

- persistent server-side conversation memory
- application-tracker state updates
- resume analysis pipelines
- mentor logic
- repository-backed chat history

At the current stage, the chat conversation is request-driven:

- the frontend holds the message thread state
- the frontend sends the current message history to `/api/chat`
- the backend does not persist chat state between requests

## High-Level Module Boundary

### Frontend responsibility

The frontend chat module is responsible for:

- rendering the conversation UI
- holding client-side thread state
- sending requests to `/api/chat`
- rendering assistant messages and sources
- turning inline links into clickable output
- handling browser speech recognition and audio meter behavior

### Backend responsibility

The backend chat module is responsible for:

- receiving validated chat requests
- delegating chat execution through the application boundary
- calling the assistant adapter through a port
- mapping OpenAI output into domain-safe chat reply data
- returning structured success or failure responses

### External dependency boundary

The chat module talks to OpenAI through:

- port: `IChatAssistantPort`
- adapter: `OpenAIChatAssistantAdapter`

This keeps provider-specific SDK usage outside route and domain code.

## Current Architecture in This Branch

### Backend flow

The current backend flow is:

1. `POST /api/chat` receives `{ messages }`
2. the route validates HTTP payload shape with `zod`
3. the route calls `askChatUseCase.execute(messages)`
4. the use case calls the outbound assistant port
5. the OpenAI adapter calls the Responses API
6. the adapter parses assistant text and sources
7. the route maps `AttemptResult` to HTTP JSON response

### Frontend flow

The current frontend flow is:

1. the user types or dictates a message
2. `useChatThread()` appends the local user message
3. the hook sends the full thread to `/api/chat`
4. the assistant reply is appended on success
5. a fallback assistant error message is appended on failure
6. `useVoiceInput()` manages browser speech recognition and the live meter

## Files in This Module

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
- `apps/web/src/modules/chat/hooks/use-voice-input.ts`
- `apps/web/src/modules/chat/lib/render-message-content.tsx`
- `apps/web/src/modules/chat/types.ts`

### Supporting module files

- `scripts/with-root-env.sh`
- `scripts/start-dev.sh`
- `README.md`

## Inputs and Outputs

### Backend input

The backend input to the chat module is:

```ts
{
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
  }>
}
```

The current route enforces:

- `messages` must exist
- at least one message must be present
- every message must have `id`, `role`, and non-empty `content`

### Backend output

On success, the backend returns:

```ts
{
  reply: string
  sources: Array<{
    title: string
    url: string
  }>
}
```

On failure, the backend returns an HTTP error payload such as:

```ts
{
  error: string
}
```

### Frontend input

The frontend accepts:

- typed text in the textarea
- dictated transcript from browser speech recognition

### Frontend output

The frontend outputs:

- rendered user and assistant message bubbles
- source links under assistant answers
- clickable inline links in assistant message content
- pending state while waiting
- fallback assistant error message when the request fails

## Domain, Port, Adapter, and Use Case Responsibilities

### Domain

The domain layer for this module currently defines:

- `ChatRole`
- `ChatSource`
- `ChatMessage`
- `ChatReply`
- base assistant instructions via `buildChatInstructions()`

What belongs here:

- plain chat types
- plain data shapes
- assistant instruction text that is part of module-level behavior

What does **not** belong here:

- OpenAI SDK calls
- HTTP handling
- browser state
- provider response parsing

### Port

`IChatAssistantPort` defines the contract the application layer depends on:

- given `ChatMessage[]`
- return `Promise<AttemptResult<ChatAssistantError, ChatReply>>`

This expresses:

- the application needs “a chat assistant”
- but should not know whether that assistant is OpenAI or something else

### Adapter

`OpenAIChatAssistantAdapter` owns:

- OpenAI SDK usage
- Responses API call
- web-search tool declaration
- provider-specific payload parsing
- extraction and deduplication of sources
- mapping external failures into typed `ChatAssistantError`

This is the correct place for:

- SDK integration
- response-shape translation
- provider quirks

### Use case

`AskChatUseCase` represents the application action:

- “given a chat history, ask the assistant for a reply”

In the current implementation it is intentionally thin:

- it receives `messages`
- it normalizes and guards message history before crossing the port boundary
- it rejects invalid request-level chat histories that do not fit the module contract
- it delegates the normalized history to `assistant.reply(messages)`
- it returns the result to the delivery layer

This means the current use case now performs minimal module-local orchestration without taking over provider concerns or persistence concerns.

## Current Alignment With the Task

### Implemented

- dedicated chat UI
- user and assistant threaded messages
- internal scroll area for longer threads
- clickable inline links
- source rendering below assistant replies
- `/api/chat` route
- OpenAI-backed assistant integration
- web-search source extraction
- browser voice input
- live voice meter
- repeated dictation support
- shared root `.env` loading
- startup script
- README
- `pnpm typecheck`

### Architecture alignment that is already present

- route layer exists
- use case layer exists
- port exists
- adapter exists
- container wires dependencies
- provider-specific parsing is in the adapter, not in route or domain
- the use case now owns minimal chat-history normalization and request-shape guardrails
- route-level failure mapping distinguishes invalid chat history from adapter failures
- chat thread state helpers are separated from the hook and can be tested directly

## Current Boundaries of Chat State

At the current stage:

- frontend thread state lives in `useChatThread()`
- browser voice state lives in `useVoiceInput()`
- backend does not persist conversation history
- the server receives message history from the client on each request

So for this module, “chat state” currently means:

- client-side UI thread state
- temporary request payload history

It does **not** currently mean:

- database-backed history
- long-lived server-side session memory
- tracker-style multi-turn state machine

## Open Questions and TODO

These are the remaining architecture questions and gaps identified from the implementation and PR review.

### 1. `AskChatUseCase` now has explicit module-local orchestration

Implemented:

- trims and normalizes outgoing message content
- removes blank messages that may survive HTTP shape validation
- enforces that the latest message must come from the user
- caps forwarded history before the assistant call
- returns a feature-level `invalid_message_history` error for invalid request histories

Current decision:

- this logic belongs in the use case because it is application-flow orchestration for the chat module
- it stays outside the route and outside the OpenAI adapter

Possible future extensions that would still fit this module:

- map adapter failures into a more feature-level chat error if needed

### 2. `AskChatUseCase` remains a class for consistency with the current app structure

Decision:

- it now owns a real application boundary plus module-level orchestration
- the repo already uses class-based use cases wired through the container
- keeping this shape avoids introducing a one-off pattern only for chat

### 3. Define whether “web-backed answers” need a user-visible mode switch

Current state:

- the adapter always exposes the web-search tool to the model
- the model decides whether to use it

Open question:

- is this enough for the intended product behavior
- or should the UI/backend later expose explicit control for web-backed vs non-web-backed answering

### 4. Add explicit module-level tests

Current state:

- the branch now includes focused module-level tests for:
  - `AskChatUseCase`
  - `/api/chat`
  - chat thread state helpers used by `useChatThread()`
  - link rendering helper behavior
- the branch still passes `pnpm typecheck`

Coverage added in this branch:

- invalid payload and invalid-history route mapping
- empty-response and adapter-failure route mapping
- message normalization and history capping in the use case
- outgoing thread preparation and assistant-message creation for chat thread state
- markdown-link, raw-URL, and line-break rendering behavior

### 5. Keep this module separate from tracker-style conversation state

Current state:

- this module is request-based and frontend-state-based

Open question:

- if persistent chat history or assistant memory is added later, does it still belong to this module
- or does that become a separate assistant/tracker boundary with repository involvement

Current recommendation:

- keep this chat module simple
- do not mix it yet with tracker or mentor persistence concerns

## Summary

This chat module is already a valid hex-aligned feature slice:

- route for delivery
- use case for application action
- port for dependency contract
- adapter for OpenAI integration
- frontend module split into UI, thread state, voice input, and rendering helpers
