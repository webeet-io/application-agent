DO $$ BEGIN
  CREATE TYPE career_profile_status AS ENUM ('draft', 'ready');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE onboarding_session_status AS ENUM ('in_progress', 'completed', 'abandoned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

create table if not exists onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status onboarding_session_status not null default 'in_progress',
  current_step text not null default 'resume_upload',
  resume_id uuid null references resumes(id) on delete set null,
  resume_text text null,
  profile_draft_json jsonb null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_sessions_current_step_check
    check (current_step in ('resume_upload', 'guided_chat', 'review', 'completed'))
);

create index if not exists onboarding_sessions_user_id_idx on onboarding_sessions (user_id);
create index if not exists onboarding_sessions_status_idx on onboarding_sessions (status);
create unique index if not exists onboarding_sessions_one_active_per_user_idx
  on onboarding_sessions (user_id)
  where status = 'in_progress';

create table if not exists career_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status career_profile_status not null default 'draft',
  profile_json jsonb not null default '{}'::jsonb,
  source_resume_id uuid null references resumes(id) on delete set null,
  onboarding_session_id uuid null references onboarding_sessions(id) on delete set null,
  completeness_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint career_profiles_completeness_score_check
    check (completeness_score >= 0 and completeness_score <= 100)
);

create unique index if not exists career_profiles_user_id_idx on career_profiles (user_id);
create index if not exists career_profiles_status_idx on career_profiles (status);

create table if not exists onboarding_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references onboarding_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint onboarding_chat_messages_role_check
    check (role in ('assistant', 'user', 'system'))
);

create index if not exists onboarding_chat_messages_session_id_idx
  on onboarding_chat_messages (session_id, created_at);
create index if not exists onboarding_chat_messages_user_id_idx
  on onboarding_chat_messages (user_id, created_at);

alter table onboarding_sessions enable row level security;
alter table career_profiles enable row level security;
alter table onboarding_chat_messages enable row level security;

create policy "onboarding_sessions_select_own" on onboarding_sessions
  for select using (auth.uid() = user_id);
create policy "onboarding_sessions_insert_own" on onboarding_sessions
  for insert with check (auth.uid() = user_id);
create policy "onboarding_sessions_update_own" on onboarding_sessions
  for update using (auth.uid() = user_id);
create policy "onboarding_sessions_delete_own" on onboarding_sessions
  for delete using (auth.uid() = user_id);

create policy "career_profiles_select_own" on career_profiles
  for select using (auth.uid() = user_id);
create policy "career_profiles_insert_own" on career_profiles
  for insert with check (auth.uid() = user_id);
create policy "career_profiles_update_own" on career_profiles
  for update using (auth.uid() = user_id);
create policy "career_profiles_delete_own" on career_profiles
  for delete using (auth.uid() = user_id);

create policy "onboarding_chat_messages_select_own" on onboarding_chat_messages
  for select using (auth.uid() = user_id);
create policy "onboarding_chat_messages_insert_own" on onboarding_chat_messages
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1
      from onboarding_sessions
      where onboarding_sessions.id = session_id
        and onboarding_sessions.user_id = auth.uid()
    )
  );
create policy "onboarding_chat_messages_update_own" on onboarding_chat_messages
  for update using (auth.uid() = user_id);
create policy "onboarding_chat_messages_delete_own" on onboarding_chat_messages
  for delete using (auth.uid() = user_id);
