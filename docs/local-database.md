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

Copy the `anon key` and `service_role key` from the output into your `.env.local`.

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
