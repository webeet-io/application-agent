# Local Database (Supabase + Docker)

This project uses the [Supabase CLI](https://supabase.com/docs/guides/cli) to run a full Supabase stack locally via Docker. It mirrors the remote (STG/PRD) environment exactly — same Postgres version, same Auth, same Storage, same RLS policies.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- Supabase CLI installed: `brew install supabase/tap/supabase`

## Start

```bash
pnpm db:start
```

Boots all containers (Postgres, Auth, Storage, Studio, Realtime, etc.). On first run this pulls Docker images — takes ~1–2 min. Subsequent starts are fast.

Once running, the CLI prints the local URLs and keys:

| Service        | URL                          |
| -------------- | ---------------------------- |
| API            | http://127.0.0.1:54321       |
| Studio         | http://127.0.0.1:54323       |
| DB (direct)    | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Inbucket (email) | http://127.0.0.1:54324     |

## Required App Env for Local Development

Running the local database is only one half of the setup. If you want the app to use this local Docker Supabase instance, the Next.js app must also point to the same local Supabase URLs and keys.

The app loads env files in this order:

1. root `.env`
2. root `.env.local`

If the same variable exists in both files, `.env.local` overrides `.env`.

This is important because the shared `.env` may contain placeholders or example values such as:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

or commented examples like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
```

Those values document the shape of the config, but they are not valid local runtime values.

If you boot the app while those placeholders are still active, API routes can fail with errors such as:

```text
Invalid supabaseUrl: Provided URL is malformed.
```

## What to Put in `.env.local`

For local Docker Supabase, create a root `.env.local` file and set:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRFA0NiK7urOoD9bje4iOUS5dbUasLEesdJiuujjNVY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hj04zWl196z2-SBc0
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

These local values are also present in `.env.example`.

Use them as local overrides:

- keep `.env` for shared defaults/examples
- put real local values into `.env.local`

Do not replace the local URL with a placeholder like `your_supabase_url`.

Also do not replace it with `https://<project>.supabase.co` unless you intentionally want to connect to a real remote Supabase project instead of the local Docker stack described in this document.

## Recommended Local Flow

1. Start local Supabase with `pnpm db:start`
2. Create `.env.local` in the repo root if it does not exist
3. Copy the local Supabase values from `.env.example` into `.env.local`
4. Start the app with `pnpm dev` or `pnpm dev:stack`

## Troubleshooting

If the frontend loads but chat or API routes fail:

1. Check whether `.env.local` exists in the repo root
2. Verify that `NEXT_PUBLIC_SUPABASE_URL` is `http://127.0.0.1:54321` for local Docker Supabase
3. Verify that the anon key and service role key are the local CLI values, not placeholders
4. Restart the app after changing env files

Typical bad values:

- `your_supabase_url`
- `https://<project>.supabase.co`
- `<anon-key>`
- `<service-role-key>`

Typical good local values:

- `http://127.0.0.1:54321`
- the fixed local anon key from `.env.example`
- the fixed local service role key from `.env.example`

## Stop

```bash
pnpm db:stop
```

Stops all containers but keeps the database data intact. Run `pnpm db:start` again to resume.

To stop **and wipe all local data**:

```bash
supabase stop --no-backup
```

## Seed

```bash
pnpm db:seed
```

Resets the local database to a clean state, re-runs all migrations, then loads `supabase/seed.sql`. This is the canonical way to get a predictable dev baseline.

> **Warning:** this is destructive — all local data is wiped and replaced with seed data. Never run against STG or PRD.

The seed file is at `supabase/seed.sql`. Add realistic but fake rows there (companies, job listings, etc.). Do not include real user data or credentials.

## Environments

| Env   | How to connect                                        |
| ----- | ----------------------------------------------------- |
| Local | `pnpm db:start` (Docker, see above)                   |
| STG   | Supabase project — set `NEXT_PUBLIC_SUPABASE_URL` + keys in CI/Vercel STG env |
| PRD   | Supabase project — set `NEXT_PUBLIC_SUPABASE_URL` + keys in CI/Vercel PRD env |

## Applying schema changes

1. Write a new migration file in `supabase/migrations/` (name format: `YYYYMMDDHHMMSS_description.sql`)
2. Run `pnpm db:seed` to apply it locally and verify
3. Push to STG via `supabase db push --linked` (ensure the correct project is linked)

## Useful one-liners

```bash
# Open an interactive Postgres shell against the local DB
supabase db query --local "select now()"

# Run the Studio UI (already included in pnpm db:start)
open http://127.0.0.1:54323

# Check container status
supabase status
```
