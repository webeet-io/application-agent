# Meeting Insights & Decisions — CeeVee / Application Agent Kickoff
**Date:** March 23, 2026
**Duration:** ~2h 38m

---

## Participants

- **David Rajcher** — Mentor/founder (Webit)
- **Sam M** — Senior contributor / software architect (voluntary)
- **Anca Afloroaei** — Product Manager
- **Anastasia Kiessig** — Developer intern
- **Ayelen Kirchhoff** — Developer intern
- **Denny Marx** — Developer intern
- **Joshua Väth** — Developer intern

---

## Key Decisions

### Product & Scope
- **Project name:** CeeVee / Application Agent — an AI-powered job search and resume optimization tool
- **Tech stack:** Next.js (frontend + backend), Supabase (DB + file storage), Apollo (email discovery)
- **Architecture:** Port-Adapter pattern to allow easy swapping of integrations
- **LinkedIn scraping explicitly excluded** — LinkedIn blocks scraping and charges per application; strategy is to go directly to company career pages instead
- **Cover Letter Builder moved out of scope** for v0
- **ATS detection included** — identify Ashby, Workday, Greenhouse, etc. and use their APIs instead of scraping
- **One-user scope for v0** — no multi-user/team features

### Process
- **Sam M to set up initial Next.js + TypeScript boilerplate** so everyone starts from a shared foundation
- **Feature branching enforced** — no direct pushes to main
- **Daily commits required** — at minimum a plan/markdown file per person per day
- **Each intern owns one feature** and works on a dedicated branch
- **Anca acts as Product Manager** — focused on product coherence, not coding
- Follow-up sprint planning / demo day scheduled for the next day

---

## Product: Feature List

### Must-Have (v0)
- **Resume upload and storage** — support multiple resume versions per user
- **Company discovery** — natural language search (e.g., "software startups in Berlin in FinTech") returning a curated company list
- **Career page scraping** — scrape company career pages weekly or on-demand to find open positions
- **ATS provider detection** — identify the ATS platform a company uses and call its API instead of scraping
- **Resume-to-job matching score** — compare resume to job listing, return a match percentage with explanation and skill gaps
- **Ranked opportunity feed** — opportunities ranked by match quality with reasoning

### Out of Scope (v0)
- LinkedIn scraping
- Cover letter builder
- Multi-user / team features

### Later Iterations (team suggestions)
- **Skills backlog** (Sam) — inventory of all user skills beyond what's on the CV; agent auto-adjusts CV when a job requires backlog skills
- **Cover letter talking points** (Anca) — key points tailored per company using scraped company values, not a full cover letter
- **Direct email outreach** (David) — use Apollo to find engineering manager emails and draft personalized intro emails
- **Application history + RAG** — embed full application history so the LLM can surface patterns about what's working
- **Recruiter simulation agent** (Ayelen) — agent reviews the user's CV as if it were a recruiter
- **Application insight / learning system** — track what kinds of applications lead to success

---

## Technical Direction

| Concern | Choice |
|---|---|
| Frontend + Backend | Next.js (monorepo, no separate service for v0) |
| Database & Auth | Supabase (PostgreSQL) |
| File storage | Supabase |
| Email/contact discovery | Apollo (port-adapter, swappable) |
| Architecture pattern | Port-Adapter |
| RAG pipeline | Embed resume chunks + application history; retrieve at query time |
| Dev workflow | AI-assisted (Claude Code / agents); interns act as "team leads" |
| Branching | Feature branches; no direct pushes to main |

---

## Key Insights

### On the Job Market Problem
- **LinkedIn is broken for both sides.** Companies pay $700+ per listing and get flooded with irrelevant Easy Apply applications. Applicants compete on volume, not quality — "both sides lose."
- **Most companies don't list all roles on LinkedIn** — especially junior positions — because the cost doesn't justify it. Many open roles are invisible unless you check company career pages directly.
- **Domain expertise is systematically undervalued.** Someone with 10 years in logistics moving into software engineering is far more valuable to a logistics software company — but current tools don't surface this.
- **Going directly to company career pages** is a less competitive, less explored channel — the product's key strategic differentiation.

### On Productivity & Deep Work
- **Context switching is cognitively expensive.** 3 hours of deep work on one problem is fundamentally different from 3 hours split across 3 projects.
- **Knowledge workers have 4–6 productive hours per day** for high-focus tasks. More hours rarely equals more output — they often reduce it.
- Switching between different-natured tasks (mechanical vs. intellectual) is less draining than switching between tasks of the same cognitive type.

### On AI-Assisted Personal Productivity
- David demonstrated an Obsidian-based personal system (LLM + email + calendar) that:
  - Tracks daily habits and goals (language learning, fitness, nutrition)
  - Sends a proactive morning email with the day's plan based on calendar
  - Escalates feedback tone if patterns of excuse-making are detected
  - Builds a persistent behavioral log to identify patterns over time
- Key insight: the difference from ChatGPT is **proactivity and persistent memory** — the system comes to you, rather than you going to it.
- Obsidian praised for Markdown files (LLM-readable), being open-source, and keeping data local.

### On Collaborative Software Engineering
- "Coding" and "software engineering" are different things — software engineering is done with many people together.
- Merge conflicts are **inevitable, not bad** — use `git blame` to find the author of a conflicting line and collaborate person-to-person to resolve it.
- LLMs can help resolve conflicts: prompt it to explain each conflict and approve resolutions one-by-one.
- Each intern is framed as a "team lead" managing their own AI agent to build their feature.

### On Learning Goals
- RAG is included partly because **it's valuable on a resume**, not only because it's the most critical product feature — practical, marketable skills are an explicit goal.
- The internship has a dual mission: **ship something real** AND give each person a portfolio story to tell.
- David committed to 1-on-1 resume reviews with each intern to help them position this work effectively.

---

## Action Items

| Owner | Task |
|---|---|
| Sam M | Set up Next.js + TypeScript base project, push to GitHub |
| All interns | Accept GitHub organization invitation |
| All interns | Choose one feature, move to "In Progress," write feature plan as MD file, commit + push by end of day |
| Anca Afloroaei | Product-manage the project for coherence |
| David Rajcher | Schedule 1-on-1 resume review sessions with each intern |
| Team | Update vision document to reflect final feature list |
| Team | Sprint planning / demo meeting the following day |

---

## Notable Quotes

> "It is easier than ever to have context switching, because you could open 6 different projects and run them in parallel, but in reality, we don't run in parallel." — David

> "You can actually be productive in something like software engineering only 4 to 6 hours a day... even if you put 12 hours a day, most likely you have, like, good 4-6 hours out of those 12." — David

> "People just apply on LinkedIn... Easy Apply, easy apply, easy apply, easy apply. And then you get — both sides lose." — David

> "LinkedIn is quite expensive, which also means that a lot of companies might have 10 roles open but they only put 2 on LinkedIn." — David

> "If you come as a software engineer but you have years of expertise and knowledge [in logistics], that can make you much more valuable." — David

> "The first goal is actually not to achieve the tool... The first goal is for you to learn the relevant skills that you can put on your own resume." — David

> "All of me in the whole Webit environment is totally free decision. I'm not getting one cent of nothing from this. But knowledge — and that's the real payment, you know?" — Sam
