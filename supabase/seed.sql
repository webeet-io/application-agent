-- Seed data for local development
-- Run via: pnpm db:seed (which runs supabase db reset)
-- WARNING: This resets the database — local dev only.

-- Companies
insert into companies (id, name, careers_url, ats_provider) values
  ('11111111-0000-0000-0000-000000000001', 'Acme Corp',       'https://acme.example.com/careers',      'greenhouse'),
  ('11111111-0000-0000-0000-000000000002', 'Globex Inc',      'https://globex.example.com/jobs',       'lever'),
  ('11111111-0000-0000-0000-000000000003', 'Initech',         'https://initech.example.com/careers',   'workday'),
  ('11111111-0000-0000-0000-000000000004', 'Umbrella Ltd',    'https://umbrella.example.com/careers',  'ashby')
on conflict do nothing;

-- Job listings
insert into job_listings (id, company_id, title, location, description, url, fetched_at) values
  (
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000001',
    'Senior Backend Engineer',
    'Amsterdam, NL (Hybrid)',
    'Build and maintain scalable backend services using Node.js and PostgreSQL. Work closely with product and ML teams.',
    'https://acme.example.com/careers/senior-backend-engineer',
    now() - interval '2 days'
  ),
  (
    '22222222-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    'Frontend Engineer (React)',
    'Remote (EU)',
    'Own the user interface for our flagship product. Strong TypeScript and React skills required.',
    'https://acme.example.com/careers/frontend-engineer-react',
    now() - interval '1 day'
  ),
  (
    '22222222-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000002',
    'Full-Stack Engineer',
    'Berlin, DE',
    'Join a fast-growing team building developer tooling. Next.js on the frontend, Go on the backend.',
    'https://globex.example.com/jobs/full-stack-engineer',
    now() - interval '3 days'
  ),
  (
    '22222222-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000003',
    'ML Engineer',
    'Remote (Worldwide)',
    'Design and ship recommendation models. Experience with PyTorch and vector databases preferred.',
    'https://initech.example.com/careers/ml-engineer',
    now() - interval '5 days'
  ),
  (
    '22222222-0000-0000-0000-000000000005',
    '11111111-0000-0000-0000-000000000004',
    'DevOps / Platform Engineer',
    'London, UK (On-site)',
    'Own our Kubernetes infrastructure and CI/CD pipelines. Terraform and AWS experience required.',
    'https://umbrella.example.com/careers/devops-engineer',
    now() - interval '1 day'
  )
on conflict do nothing;
