-- Sahkar Setu database setup. Paste this whole file into
-- Supabase Dashboard > SQL Editor > New query, then press Run. Safe to run again.
--
-- Access model: the website's server reads and writes these tables with the
-- secret key, after checking who the user is and what their role allows.
-- Browsers never query tables directly, so RLS is on with no public policies,
-- and only service_role is granted access.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'trainee' check (role in ('trainee', 'trainer', 'employer', 'admin')),
  full_name text not null check (char_length(full_name) between 2 and 120),
  trainee_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.class_sessions (
  id text primary key,
  code text not null,
  title text not null check (char_length(title) between 3 and 80),
  room text not null check (char_length(room) between 1 and 40),
  trainer_id uuid not null,
  trainer_networks text[] not null default '{}',
  require_same_network boolean not null default true,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  flags text[] not null default '{}'
);
-- Only one open session may use a code at a time.
create unique index if not exists class_sessions_open_code on public.class_sessions (code) where ended_at is null;
create index if not exists class_sessions_trainer_idx on public.class_sessions (trainer_id);

create table if not exists public.attendance_marks (
  session_id text not null references public.class_sessions (id) on delete cascade,
  trainee_id text not null,
  device_id text not null,
  ip text not null,
  marked_at timestamptz not null default now(),
  primary key (session_id, trainee_id),
  unique (session_id, device_id)
);

create table if not exists public.posted_jobs (
  id bigint generated always as identity primary key,
  data jsonb not null,
  posted_by uuid,
  posted_at timestamptz not null default now()
);

create table if not exists public.applications (
  job_id text not null,
  trainee_id text not null,
  applied_at timestamptz not null default now(),
  primary key (job_id, trainee_id)
);
create index if not exists applications_trainee_idx on public.applications (trainee_id);

create table if not exists public.lesson_progress (
  event_id uuid primary key,
  trainee_id text not null,
  lesson_id text not null,
  score smallint not null check (score >= 0),
  total smallint not null check (total > 0 and score <= total),
  answered_at timestamptz not null
);
create index if not exists lesson_progress_trainee_idx on public.lesson_progress (trainee_id);

create table if not exists public.integrity_events (
  id uuid primary key,
  exam_id text not null,
  trainee_id text not null,
  type text not null check (type in ('started', 'left', 'returned', 'blur', 'fullscreen-exit', 'paste', 'copy', 'submitted')),
  at timestamptz not null,
  away_ms integer check (away_ms is null or away_ms >= 0)
);
create index if not exists integrity_events_at_idx on public.integrity_events (at desc);

create table if not exists public.lang_packs (
  code text primary key,
  pack jsonb not null,
  updated_at timestamptz not null default now()
);

-- Lock everything down: RLS on, nothing for anon/authenticated, server key only.
alter table public.profiles enable row level security;
alter table public.class_sessions enable row level security;
alter table public.attendance_marks enable row level security;
alter table public.posted_jobs enable row level security;
alter table public.applications enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.integrity_events enable row level security;
alter table public.lang_packs enable row level security;

revoke all on public.profiles, public.class_sessions, public.attendance_marks, public.posted_jobs,
  public.applications, public.lesson_progress, public.integrity_events, public.lang_packs
  from anon, authenticated;

grant select, insert, update, delete on public.profiles, public.class_sessions, public.attendance_marks,
  public.posted_jobs, public.applications, public.lesson_progress, public.integrity_events, public.lang_packs
  to service_role;
grant usage, select on all sequences in schema public to service_role;
