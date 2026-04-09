# CeeVee (Application Agent)

CeeVee is a smart job opportunity agent that discovers companies, scrapes career pages, and matches roles to resumes.

## Key Docs
- `ARCHITECTURE.md`
- `CHECKLIST.md`
- `docs/INDEX.md`
- `docs/PULL_REQUEST_GUIDE.md`

## Notes
- Core architecture: functional domain + hexagonal ports and adapters.
- Use cases live in `apps/web/src/application`.

## Requirements

- Node.js 20+
- `pnpm`

## Installation

```bash
pnpm install
```

## Environment

The project loads environment variables from the repository root using `scripts/with-root-env.sh`.

Load order:

1. `.env`
2. `.env.local`

If the same key exists in both files, `.env.local` wins and overrides `.env`.

This distinction matters a lot in local development:

- `.env` is the shared base file.
- `.env.local` is your machine-specific override file.
- `.env.local` is gitignored and should be used for local-only values.

### `.env` vs `.env.local`

The root `.env` may contain placeholder or example-looking values such as:

```env
OPENAI_API_KEY=your_key_here
OPENAI_CHAT_MODEL=gpt-4.1-mini
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Those values are not valid runtime credentials. They are only there to document which keys the app expects.

In particular, values like:

- `your_supabase_url`
- `https://<project>.supabase.co`
- `<anon-key>`
- `<service-role-key>`

are placeholders, not working connection values.

If you run the app with those placeholders still active, parts of the app can fail at runtime. One common symptom is:

```text
Invalid supabaseUrl: Provided URL is malformed.
```

### Local Supabase Setup

If you are following the local development flow described in this README, the app is expected to talk to a locally running Supabase stack.

That is because `pnpm dev:stack` starts the local development setup, including local Supabase services.

In that local-dev scenario, create a root `.env.local` file and put your local Supabase values there.

Use the local Docker URLs/keys, not the placeholder values from `.env`.

You can copy them from `.env.example`, which already contains the correct local defaults, or create the file manually:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRFA0NiK7urOoD9bje4iOUS5dbUasLEesdJiuujjNVY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hj04zWl196z2-SBc0
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
OPENAI_CHAT_MODEL=gpt-4.1-mini
```

What each file should contain:

- `.env`
  Shared defaults, examples, or team-wide non-machine-specific values.
- `.env.local`
  The actual values your machine should use when you run the app locally.

Practical rule:

- If you are running the local Docker Supabase stack, `NEXT_PUBLIC_SUPABASE_URL` in `.env.local` should normally be `http://127.0.0.1:54321`.
- Do not leave local development pointing at placeholder text from `.env`.

### Remote Supabase Environments

Supabase does not have to be local in every environment.

For STG, PRD, or any setup where you intentionally connect to a hosted Supabase project, use the real remote values instead:

- `NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co`
- the real anon key for that project
- the real service role key for that project

In other words:

- use local values from `.env.local` when following the local Docker dev flow from this README
- use real remote values when intentionally pointing the app to STG/PRD or another hosted Supabase project

### Troubleshooting

If the frontend opens but chat or API routes fail, check the env layering first.

Example failure:

```text
Invalid supabaseUrl: Provided URL is malformed.
```

This usually means one of the following:

- `NEXT_PUBLIC_SUPABASE_URL` is still a placeholder from `.env`
- `.env.local` does not exist
- `.env.local` exists but does not override the placeholder with a real local URL

Quick fix:

1. Make sure Supabase is running locally.
2. Create `.env.local` in the repo root if it does not exist.
3. Put the local Supabase values from `.env.example` into `.env.local`.
4. Restart `pnpm dev:stack`.

## Start Frontend and Backend

In this project, the frontend and backend run together inside one Next.js app. The backend is exposed through API routes on the same server, currently mainly under `/api/chat`.

Start both together with:

```bash
pnpm dev:stack
```

The script:

- starts the Next.js dev server on `0.0.0.0:3000`
- prints the local frontend URL
- prints the network IP address(es), so you can open the app from other devices on the same network
- prints the backend API URL on the same server

Typical output:

```text
Frontend:
  Local:   http://localhost:3000
  Network: http://192.168.x.x:3000

Backend (Next.js API route on the same server):
  Local:   http://localhost:3000/api/chat
  Network: http://192.168.x.x:3000/api/chat
```

Stop it with `Ctrl+C`.

## Alternative Dev Start

Start only the web app:

```bash
pnpm dev
```

## Useful Scripts

```bash
pnpm typecheck
pnpm lint
pnpm build
```
