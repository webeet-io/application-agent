-- Initial schema for CeeVee (Application Agent)
-- Enables pgvector and defines core tables for resumes, jobs, applications, and embeddings.

create extension if not exists pgcrypto;
create extension if not exists vector;

-- Enums
DO $$ BEGIN
  CREATE TYPE ats_provider AS ENUM (
    'greenhouse',
    'lever',
    'workday',
    'ashby',
    'personio',
    'softgarden',
    'dvinci',
    'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'saved',
    'applied',
    'interview',
    'rejected',
    'offer',
    'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Core tables
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  careers_url text not null,
  ats_provider ats_provider not null default 'unknown',
  created_at timestamptz not null default now()
);

create unique index if not exists companies_careers_url_key on companies (careers_url);

create table if not exists job_listings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  location text not null,
  description text not null,
  url text not null,
  fetched_at timestamptz not null,
  raw_json jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists job_listings_company_id_idx on job_listings (company_id);
create index if not exists job_listings_fetched_at_idx on job_listings (fetched_at);

create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  file_url text not null,
  storage_path text not null,
  original_file_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on resumes (user_id);

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null references job_listings(id),
  resume_id uuid not null references resumes(id),
  status application_status not null default 'saved',
  applied_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_user_id_idx on applications (user_id);
create index if not exists applications_job_id_idx on applications (job_id);

create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  resource_type text not null,
  resource_id uuid not null,
  chunk_index integer not null default 0,
  content text not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now(),
  constraint embeddings_resource_type_check check (resource_type in ('resume', 'job_listing', 'application', 'company'))
);

create unique index if not exists embeddings_resource_chunk_key on embeddings (resource_type, resource_id, chunk_index);
create index if not exists embeddings_resource_idx on embeddings (resource_type, resource_id);

-- Row Level Security
alter table resumes enable row level security;
alter table applications enable row level security;
alter table companies enable row level security;
alter table job_listings enable row level security;
alter table embeddings enable row level security;

create policy if not exists "resumes_select_own" on resumes
  for select using (auth.uid() = user_id);
create policy if not exists "resumes_insert_own" on resumes
  for insert with check (auth.uid() = user_id);
create policy if not exists "resumes_update_own" on resumes
  for update using (auth.uid() = user_id);
create policy if not exists "resumes_delete_own" on resumes
  for delete using (auth.uid() = user_id);

create policy if not exists "applications_select_own" on applications
  for select using (auth.uid() = user_id);
create policy if not exists "applications_insert_own" on applications
  for insert with check (auth.uid() = user_id);
create policy if not exists "applications_update_own" on applications
  for update using (auth.uid() = user_id);
create policy if not exists "applications_delete_own" on applications
  for delete using (auth.uid() = user_id);

-- Companies and job listings are readable by all authenticated users.
create policy if not exists "companies_select_all" on companies
  for select using (auth.role() = 'authenticated');
create policy if not exists "job_listings_select_all" on job_listings
  for select using (auth.role() = 'authenticated');

-- Storage bucket for resumes
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

create policy if not exists "resumes_storage_select_own" on storage.objects
  for select using (bucket_id = 'resumes' and auth.uid() = owner);
create policy if not exists "resumes_storage_insert_own" on storage.objects
  for insert with check (bucket_id = 'resumes' and auth.uid() = owner);
create policy if not exists "resumes_storage_update_own" on storage.objects
  for update using (bucket_id = 'resumes' and auth.uid() = owner);
create policy if not exists "resumes_storage_delete_own" on storage.objects
  for delete using (bucket_id = 'resumes' and auth.uid() = owner);
