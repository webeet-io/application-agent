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

The project uses a global root `.env` file in the project directory.

Example:

```env
OPENAI_API_KEY=your_key_here
OPENAI_CHAT_MODEL=gpt-4.1-mini
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The scripts load this file automatically through `scripts/with-root-env.sh`.

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
