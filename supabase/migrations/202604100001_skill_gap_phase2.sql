-- Skill gap Phase 2: three new tables for mentor preferences, declared skills, and learning progress.
-- All three are user-scoped and protected by RLS.

-- mentor_preferences
-- One row per user. Stores strategy mode and target role configuration.
-- Upserted when the user changes their settings.
create table if not exists mentor_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  strategy_mode text not null default 'balanced',
  target_role_families text[] not null default '{}',
  target_seniority text not null default 'mid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists mentor_preferences_user_id_key on mentor_preferences (user_id);

-- user_declared_skills
-- Skills the user has explicitly declared they know, separate from resume signals.
-- Multiple rows per user — one per declared skill.
create table if not exists user_declared_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null,
  confidence text not null default 'medium',
  evidence text null,
  is_on_resume boolean not null default false,
  declared_at timestamptz not null default now()
);

create unique index if not exists user_declared_skills_user_skill_key on user_declared_skills (user_id, skill_name);

-- learning_progress_events
-- Append-only log of learning activity per skill gap.
-- Events are never updated — new events are appended.
-- The domain reads these to derive readiness state.
create table if not exists learning_progress_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gap_name text not null,
  gap_kind text not null,
  event_type text not null,
  occurred_at timestamptz not null,
  evidence_level text not null,
  artifact_type text null,
  artifact_url text null,
  related_step_order integer null,
  details text null,
  created_at timestamptz not null default now()
);

create index if not exists learning_progress_events_user_gap_idx on learning_progress_events (user_id, gap_name);
create index if not exists learning_progress_events_user_occurred_idx on learning_progress_events (user_id, occurred_at);

-- RLS
alter table mentor_preferences enable row level security;
alter table user_declared_skills enable row level security;
alter table learning_progress_events enable row level security;

create policy "mentor_preferences_select_own" on mentor_preferences
  for select using (auth.uid() = user_id);
create policy "mentor_preferences_insert_own" on mentor_preferences
  for insert with check (auth.uid() = user_id);
create policy "mentor_preferences_update_own" on mentor_preferences
  for update using (auth.uid() = user_id);
create policy "mentor_preferences_delete_own" on mentor_preferences
  for delete using (auth.uid() = user_id);

create policy "user_declared_skills_select_own" on user_declared_skills
  for select using (auth.uid() = user_id);
create policy "user_declared_skills_insert_own" on user_declared_skills
  for insert with check (auth.uid() = user_id);
create policy "user_declared_skills_update_own" on user_declared_skills
  for update using (auth.uid() = user_id);
create policy "user_declared_skills_delete_own" on user_declared_skills
  for delete using (auth.uid() = user_id);

-- No update policy — this table is append-only. Events are never modified after insertion.
create policy "learning_progress_events_select_own" on learning_progress_events
  for select using (auth.uid() = user_id);
create policy "learning_progress_events_insert_own" on learning_progress_events
  for insert with check (auth.uid() = user_id);
create policy "learning_progress_events_delete_own" on learning_progress_events
  for delete using (auth.uid() = user_id);
