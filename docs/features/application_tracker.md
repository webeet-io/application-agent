# Feature: Application Tracker (Phase 2 — Kanban + CeeVee Conversations)

**Assigned to:** David Rajcher
**Builds on:** PR #37 (`feat-application-tracker`) by @jshvth

---

## What Was Already Built (PR #37)

jshvth implemented the backend foundation:

- **`SupabaseApplicationRepositoryAdapter`** — full CRUD against the `applications` table
- **`MarkApplicationAppliedUseCase`** — creates an application record with `status: 'applied'`
- **`UpdateApplicationStatusUseCase`** — transitions status; maps `no_response` to `rejected` until schema migration
- **`POST /api/applications/apply`** — create a new application
- **`PATCH /api/applications/{id}/status`** — update its status

Current `ApplicationStatus` enum: `saved | applied | interview | rejected | offer | withdrawn`

This phase adds the UI (Kanban board) and the CeeVee conversation layer on top of that foundation.

---

## Phase 2 Goal

Give the user a visual, interactive tracker where each job application is a card on a Kanban board. Moving a card between columns triggers a CeeVee AI conversation that captures context about what happened — building a structured history that powers preparation and insights.

---

## Kanban Board

### Columns (Status Stages)

| Column | Status key | Description |
|---|---|---|
| Saved | `saved` | Bookmarked, not yet applied |
| Applied | `applied` | Resume sent |
| Phone Screen | `phone_screen` | HR / recruiter call scheduled or done |
| Technical Interview | `technical_interview` | Coding / system-design round |
| Final Round | `final_round` | On-site or exec round |
| Offer | `offer` | Offer received |
| Rejected | `rejected` | Declined at any stage |
| Withdrawn | `withdrawn` | User withdrew |

> **Schema note:** `phone_screen`, `technical_interview`, and `final_round` are new enum values not in PR #37. A migration is needed before these columns are live.

### Card Contents

Each card represents one job application. It should display:

- Company name + logo (from job listing)
- Job title
- Which resume was sent (`resumeId` → resolved name)
- Current status badge
- Date applied
- Last CeeVee conversation summary (one-liner, if any)
- "Prep me" button (appears once the application has at least one recorded conversation)

---

## CeeVee Conversation on Status Change

When the user drags a card from one column to another, a CeeVee chat popup opens **before** the status is persisted. The popup is contextual to the specific transition.

### Trigger Messages by Transition

| From | To | CeeVee opens with... |
|---|---|---|
| `applied` | `phone_screen` | "You got a callback — nice! Who reached out, and what do you know about the role so far?" |
| `phone_screen` | `technical_interview` | "Congrats, you passed the phone screen! Can you tell me how it went? What did they ask, and how did you feel about it?" |
| `technical_interview` | `final_round` | "You made it to the final round! Walk me through the technical interview — what topics came up?" |
| `final_round` | `offer` | "You got an offer! Tell me about the process — what stood out?" |
| `*` | `rejected` | "Sorry to hear that. Do you know at what stage things fell through? Any feedback from the interviewer?" |
| `*` | `withdrawn` | "Got it. What made you decide to step back from this one?" |

The user can skip the conversation (dismisses the popup), but skipping means no summary is stored for that transition.

### Chat Behavior

- The conversation is a standard CeeVee chat (uses the existing `AskChatUseCase` / `OpenAIChatAssistantAdapter`)
- After the user finishes, CeeVee generates a **structured summary** of the exchange
- The summary is stored against the application record, tagged with the transition (`from_status → to_status`) and timestamp
- The status is persisted **after** the conversation completes (or is skipped)

---

## "Prep Me" Button

Available on any card that has at least one stored conversation summary.

Pressing it triggers CeeVee to synthesize:

1. A timeline of the application — what happened at each stage
2. Key themes from each conversation (what the company cares about, red flags, open questions)
3. Recommended preparation steps for the next stage
4. Relevant parts of the resume that were discussed

This is a read-only generation — no new conversation, just synthesis of stored summaries.

---

## CeeVee Insights (Aggregate, Cross-Application)

Once the user has tracked enough applications, CeeVee can surface patterns across all their history. This is a separate view (not per-card).

### Example Insights

- "You tend to advance past phone screens 80% of the time, but convert only 1 in 5 technical interviews. That's where to focus."
- "Your strongest signal in rejected applications: technical depth on system design was flagged 3 times."
- "Companies that asked about leadership experience were more likely to extend offers."

### Data Source

Each conversation summary stored on an application is the raw material. CeeVee aggregates across summaries to find patterns.

---

## Data Model Extensions Needed

On top of what PR #37 shipped, this phase requires:

### New `ApplicationStatus` enum values

```sql
ALTER TYPE application_status ADD VALUE 'phone_screen';
ALTER TYPE application_status ADD VALUE 'technical_interview';
ALTER TYPE application_status ADD VALUE 'final_round';
```

### New `application_conversations` table

```sql
CREATE TABLE application_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  from_status TEXT NOT NULL,
  to_status   TEXT NOT NULL,
  summary     TEXT,              -- CeeVee-generated summary of the chat
  raw_messages JSONB,            -- Full message history (optional, for debugging/reprocessing)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## API Routes Needed

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/applications` | Fetch all applications for the current user (for Kanban render) |
| `POST` | `/api/applications/{id}/conversations` | Save a conversation summary after a status transition |
| `GET` | `/api/applications/{id}/conversations` | Fetch all conversations for a single application (for "Prep me") |
| `GET` | `/api/applications/insights` | Aggregate insights across all applications |

The existing routes from PR #37 remain unchanged:
- `POST /api/applications/apply`
- `PATCH /api/applications/{id}/status`

---

## Out of Scope (This Phase)

- Auto-reminders or nudges ("you haven't heard back in 2 weeks")
- Team / shared tracking
- Email or calendar integration
- Exporting tracker data
