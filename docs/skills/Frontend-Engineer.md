# Frontend Engineer Guide

This document explains how to build features on the CeeVee frontend correctly. It covers the stack, design system, component conventions, authentication, and TypeScript requirements.

Read this before writing any new UI code.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript — **everything must be typed** |
| Styling | Tailwind CSS v4 |
| Component library | ShadCN UI (manual install) |
| Auth | Supabase Auth (SSR) |
| Database client | Supabase JS v2 |
| Package manager | pnpm (monorepo) |

The web app lives at `apps/web/`. All paths in this document are relative to that directory.

---

## TypeScript

Every file is TypeScript. There are no `.js` or `.jsx` files in `src/`.

- Use explicit types for props, function parameters, and return values.
- Avoid `any`. Use `unknown` when the type is genuinely unknown, then narrow it.
- Prefer `type` aliases over `interface` for consistency, unless you need declaration merging.
- Server Actions must be typed — declare the return type explicitly, e.g. `Promise<{ error: string | null }>`.

---

## File and Route Structure

```
src/
  app/
    layout.tsx                  ← Root layout (ThemeProvider, anti-flash script)
    globals.css                 ← Tailwind imports + CSS variable tokens
    login/
      page.tsx                  ← Public — the only unauthenticated route
    auth/
      callback/
        page.tsx                ← Supabase OAuth callback handler
    (dashboard)/
      layout.tsx                ← Auth guard + sidebar + onboarding modal
      page.tsx                  ← Dashboard home (/)
      opportunities/page.tsx
      career-profile/page.tsx
      tracker/page.tsx
      learning/page.tsx
      settings/
        page.tsx                ← Server component — fetches data
        settings-view.tsx       ← Client component — interactive UI
      profile/
        page.tsx
        profile-view.tsx
      not-found.tsx             ← 404 rendered inside dashboard layout
      [...slug]/page.tsx        ← Required catch-all — calls notFound()
  components/
    ui/                         ← ShadCN primitives (button, input, label, …)
    dashboard-sidebar.tsx
    onboarding-modal.tsx
    theme-provider.tsx
  modules/
    auth/
      actions.ts                ← Server Actions for auth/profile mutations
      components/
        login-form.tsx
  lib/
    supabase/
      client.ts                 ← Browser Supabase client
      server.ts                 ← Server Supabase client (SSR cookies)
  assets/
    logo.png                    ← In-app logo (use next/image)
    favicon.ico                 ← Copied to public/ for tab icon
```

---

## Authentication — All Routes Are Protected

Every route inside `(dashboard)/` is auth-locked. The lock lives in `src/app/(dashboard)/layout.tsx`:

```tsx
// (dashboard)/layout.tsx — server component
const supabase = await createServerClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

**Rules:**
- `/login` is the only public route.
- `/auth/callback` is a short-lived callback handler — it redirects immediately.
- Any new page added under `(dashboard)/` is automatically protected.
- Never add auth checks inside individual page components — the layout handles it.
- Never add a page outside `(dashboard)/` unless it is genuinely public.

---

## ShadCN Components

Use ShadCN for all UI primitives. Do not write raw `<button>`, `<input>`, or `<div>` wrappers when a ShadCN component exists.

Available primitives are in `src/components/ui/`:

| Component | Import path |
|---|---|
| `Button` | `@/components/ui/button` |
| `Input` | `@/components/ui/input` |
| `Label` | `@/components/ui/label` |
| `Badge` | `@/components/ui/badge` |
| `Separator` | `@/components/ui/separator` |
| `Textarea` | `@/components/ui/textarea` |

### Adding a new ShadCN component

ShadCN components are installed manually — the CLI copies source files into `src/components/ui/`. Do not install them as npm packages.

To add a component:

```bash
cd apps/web
npx shadcn@latest add <component-name>
```

This writes the component source into `src/components/ui/`. Commit the generated file.

### Customising ShadCN components

Edit the file in `src/components/ui/` directly. Do not wrap a ShadCN component just to change a class — pass `className` via the existing `cn()` merge, or edit the variant definition.

---

## Tailwind and Brand Colors

The design system uses a fixed palette. Always use these tokens — never hardcode hex values.

### Semantic tokens (Tailwind utilities)

| Token | Usage | Value |
|---|---|---|
| `bg-background` / `text-foreground` | Page background and primary text | white / near-black |
| `bg-primary` / `text-primary-foreground` | Primary actions, sidebar | `#2d3855` navy |
| `bg-secondary` / `text-secondary-foreground` | Subtle backgrounds, chips | `#e3f1e2` mint |
| `bg-muted` / `text-muted-foreground` | Disabled text, placeholders | light grey |
| `bg-destructive` | Error states, delete actions | red |
| `border` | Default border color | — |
| `bg-brand-green` | Brand accent (login panel, highlights) | `#69bc8c` |
| `bg-brand-mauve` | Brand accent (decorative blobs) | `#a45674` |

All tokens are CSS variables defined in `src/app/globals.css`. The `@theme inline` block maps them to Tailwind utilities. Dark mode values are declared in the `.dark {}` block.

### Dark mode

Dark mode is applied by adding the `.dark` class to `<html>`. The `ThemeProvider` in `src/components/theme-provider.tsx` manages this. Every CSS variable already has a dark value — you do not need to write `dark:` variants for standard colors; just use the semantic tokens and they flip automatically.

Use `dark:` prefix only for cases where a specific element must deviate from the semantic token in dark mode.

---

## Reusable Components

Shared components live in `src/components/`. Before writing a new component, check if one already exists.

| Component | Description |
|---|---|
| `DashboardSidebar` | Collapsible sidebar with nav links; state persisted to `localStorage` |
| `OnboardingModal` | Unclosable first-run modal that creates the user's profile |
| `ThemeProvider` | Context for light/dark toggle; exposes `useTheme()` |
| `ui/*` | ShadCN primitives |

### When to create a reusable component

Create a shared component in `src/components/` when:
- The same UI appears in two or more routes.
- The component encapsulates non-trivial state or logic.

Otherwise, colocate the component with the page that uses it (e.g. `settings/settings-view.tsx`).

---

## Server vs Client Components

Next.js App Router defaults to **server components**. Follow this split:

| Use a **server component** when | Use a **client component** when |
|---|---|
| Fetching data from Supabase | The component has `useState` or `useEffect` |
| Reading cookies / auth session | The component handles user events (clicks, form input) |
| The component has no interactivity | The component uses browser APIs |

The pattern for interactive pages:

```
settings/
  page.tsx          ← server component — fetches tokens, passes as props
  settings-view.tsx ← 'use client' — renders the interactive form
```

Add `'use client'` at the top of any file that uses React hooks or event handlers. Never add it to a server component.

---

## Server Actions

Mutations (create, update, delete) go in `src/modules/<feature>/actions.ts` as Server Actions.

```ts
// src/modules/auth/actions.ts
'use server'

export async function createProfile(username: string): Promise<{ error: string | null }> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  const { error } = await supabase.from('profiles').insert({ auth_id: user.id, username })
  return { error: error?.message ?? null }
}
```

**Rules:**
- Always mark the file `'use server'`.
- Return `{ error: string | null }` — never throw from a Server Action.
- Create the Supabase client via `createServerClient()` (not the browser client).
- RLS on the database tables is the real authorization layer — the server action is the entry point, not the guard.

---

## Icons

Use [Lucide React](https://lucide.dev/) for icons. It is already installed.

```tsx
import { Trash2, Settings, ChevronRight } from 'lucide-react'

<Trash2 className="h-4 w-4" strokeWidth={1.75} />
```

Set `strokeWidth={1.75}` as the default. Use `h-4 w-4` for inline icons and `h-5 w-5` for standalone / button icons.

---

## Images and Assets

Use `next/image` for all images. Local assets live in `src/assets/`.

```tsx
import Image from 'next/image'
import logo from '@/assets/logo.png'

<Image src={logo} alt="CeeVee" width={44} height={44} />
```

`next-env.d.ts` is included in `tsconfig.json` so PNG imports are typed. Do not use `<img>` tags.

---

## Routing

Routes map to directories under `src/app/`. Follow these conventions:

- **Page component**: `page.tsx` — server component by default.
- **Interactive view**: colocate as `<route>/<feature>-view.tsx` with `'use client'`.
- **Layout**: `layout.tsx` — server component.
- **Not found**: `not-found.tsx` — rendered within the nearest layout.
- **Catch-all 404**: `[...slug]/page.tsx` (required, not optional) — calls `notFound()`.

Do not use `[[...slug]]` (optional catch-all) — it has the same specificity as the root `/` route and causes a build error.

---

## Common Mistakes

| Mistake | Correct approach |
|---|---|
| Hardcoding `#69bc8c` | Use `bg-brand-green` |
| Using `<img>` | Use `next/image` |
| Adding auth checks in page components | Auth lives in `(dashboard)/layout.tsx` |
| Using `[[...slug]]` catch-all | Use `[...slug]` (required catch-all) |
| Forgetting `rm -rf .next` after adding routes | Clear Turbopack cache when routes 404 unexpectedly |
| Throwing from a Server Action | Return `{ error: string | null }` |
| Using the browser Supabase client in a server component | Use `createServerClient()` from `@/lib/supabase/server` |
