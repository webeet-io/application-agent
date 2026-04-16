-- User profiles table.
-- Links Supabase auth.users (auth_id) to application-level profile data.
-- A row is created once during the onboarding flow after first sign-in.

create table if not exists public.profiles (
  id         uuid        primary key default gen_random_uuid(),
  auth_id    uuid        not null unique references auth.users(id) on delete cascade,
  username   text        not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = auth_id);

create policy "Users can create own profile"
  on public.profiles for insert
  with check (auth.uid() = auth_id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = auth_id);
