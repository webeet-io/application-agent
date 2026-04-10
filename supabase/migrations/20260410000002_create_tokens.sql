-- API tokens table.
-- Stores user-provided API keys (e.g. OpenAI) linked to their profile.

create table if not exists public.tokens (
  id         uuid        primary key default gen_random_uuid(),
  auth_id    uuid        not null references auth.users(id) on delete cascade,
  label      text        not null default 'OpenAI API Key',
  value      text        not null,
  created_at timestamptz not null default now()
);

alter table public.tokens enable row level security;

create policy "Users can read own tokens"
  on public.tokens for select
  using (auth.uid() = auth_id);

create policy "Users can create own tokens"
  on public.tokens for insert
  with check (auth.uid() = auth_id);

create policy "Users can delete own tokens"
  on public.tokens for delete
  using (auth.uid() = auth_id);
