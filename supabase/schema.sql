-- Sahkar Setu production schema (Supabase / Postgres 15+).
-- The prototype runs on in-memory demo data (src/lib/data.ts, src/lib/store.ts);
-- these tables replace it one for one. Every table has row-level security on.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- People and roles
-- ---------------------------------------------------------------------------

create type public.app_role as enum ('trainee', 'trainer', 'institute_admin', 'society_admin', 'employer', 'ncct_admin');

create table public.institutes (
  id bigint generated always as identity primary key,
  code text not null unique,                    -- e.g. 'ricm-gnr'
  name text not null,
  city text not null,
  state text not null
);

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'trainee',
  full_name text not null check (char_length(full_name) between 2 and 120),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'hi', 'ta')),
  institute_id bigint references public.institutes (id),   -- trainers and institute admins
  organisation text,                                        -- society or employer name
  created_at timestamptz not null default now()
);
create index profiles_institute_id_idx on public.profiles (institute_id);

create table public.trainees (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  passport_no text not null unique,             -- e.g. 'SS-26-04817'
  district text not null,
  state text not null,
  society text,
  skills text[] not null default '{}',
  open_to_employers boolean not null default false,  -- consent to appear in employer search
  created_at timestamptz not null default now()
);
-- No Aadhaar column, by design.

-- ---------------------------------------------------------------------------
-- Training
-- ---------------------------------------------------------------------------

create table public.programmes (
  id bigint generated always as identity primary key,
  slug text not null unique,
  institute_id bigint not null references public.institutes (id),
  title text not null,
  sector text not null check (sector in ('pacs', 'dairy', 'shg', 'fisheries', 'banking', 'leadership')),
  starts_on date not null,
  days smallint not null check (days between 1 and 90),
  seats smallint not null check (seats > 0),
  hostel boolean not null default false,
  skills text[] not null default '{}'
);
create index programmes_institute_id_idx on public.programmes (institute_id);
create index programmes_starts_on_idx on public.programmes (starts_on);

create table public.nominations (
  id bigint generated always as identity primary key,
  programme_id bigint not null references public.programmes (id) on delete cascade,
  trainee_id bigint not null references public.trainees (id) on delete cascade,
  nominated_by uuid references auth.users (id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'withdrawn')),
  hostel_room text,
  created_at timestamptz not null default now(),
  unique (programme_id, trainee_id)
);
create index nominations_trainee_id_idx on public.nominations (trainee_id);

create table public.class_sessions (
  id bigint generated always as identity primary key,
  code text not null unique check (code ~ '^[a-z0-9-]{1,40}$'),   -- used inside attendance tokens
  programme_id bigint not null references public.programmes (id) on delete cascade,
  trainer_id uuid not null references auth.users (id),
  title text not null,
  starts_at timestamptz not null,
  room text
);
create index class_sessions_programme_id_idx on public.class_sessions (programme_id);
create index class_sessions_trainer_id_idx on public.class_sessions (trainer_id);

create table public.attendance (
  session_id bigint not null references public.class_sessions (id) on delete cascade,
  trainee_id bigint not null references public.trainees (id) on delete cascade,
  marked_at timestamptz not null default now(),
  primary key (session_id, trainee_id)          -- one mark per trainee per session
);
create index attendance_trainee_id_idx on public.attendance (trainee_id);

create table public.lesson_progress (
  event_id uuid primary key,                    -- client-generated, makes offline resends idempotent
  trainee_id bigint not null references public.trainees (id) on delete cascade,
  lesson_id text not null,
  score smallint not null check (score >= 0),
  total smallint not null check (total > 0 and score <= total),
  answered_at timestamptz not null
);
create index lesson_progress_trainee_id_idx on public.lesson_progress (trainee_id);

create table public.certificates (
  id text primary key check (id ~ '^NCCT-\d{4}-[A-Z]{3}-\d{4}$'),
  trainee_id bigint not null references public.trainees (id),
  programme_id bigint not null references public.programmes (id),
  issued_on date not null,
  grade text not null check (grade in ('Distinction', 'First class', 'Pass')),
  score smallint not null check (score between 0 and 100),
  attendance_pct smallint not null check (attendance_pct between 0 and 100),
  signature text not null,                      -- Ed25519 over the canonical fields, base64url
  revoked_at timestamptz
);
create index certificates_trainee_id_idx on public.certificates (trainee_id);
create index certificates_programme_id_idx on public.certificates (programme_id);

-- ---------------------------------------------------------------------------
-- Employment
-- ---------------------------------------------------------------------------

create table public.jobs (
  id bigint generated always as identity primary key,
  employer_id uuid not null references auth.users (id),
  title text not null check (char_length(title) between 4 and 80),
  employer_name text not null,
  district text not null,
  state text not null,
  kind text not null check (kind in ('Full time', 'Seasonal', 'Apprenticeship', 'Enterprise support')),
  pay text not null,
  openings smallint not null check (openings between 1 and 500),
  skills text[] not null check (cardinality(skills) between 1 and 8),
  posted_at timestamptz not null default now(),
  closed_at timestamptz
);
create index jobs_employer_id_idx on public.jobs (employer_id);
create index jobs_open_idx on public.jobs (posted_at desc) where closed_at is null;
create index jobs_skills_idx on public.jobs using gin (skills);

create table public.applications (
  job_id bigint not null references public.jobs (id) on delete cascade,
  trainee_id bigint not null references public.trainees (id) on delete cascade,
  applied_at timestamptz not null default now(),
  primary key (job_id, trainee_id)
);
create index applications_trainee_id_idx on public.applications (trainee_id);

-- ---------------------------------------------------------------------------
-- Helpers for policies. In a private schema (not exposed by the API), with a
-- fixed search_path, and each one checks the caller's own identity.
-- ---------------------------------------------------------------------------

create or replace function private.my_role() returns public.app_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where user_id = (select auth.uid()) $$;

create or replace function private.my_trainee_id() returns bigint
language sql stable security definer set search_path = ''
as $$ select id from public.trainees where user_id = (select auth.uid()) $$;

create or replace function private.my_institute_id() returns bigint
language sql stable security definer set search_path = ''
as $$ select institute_id from public.profiles where user_id = (select auth.uid()) $$;

revoke all on function private.my_role(), private.my_trainee_id(), private.my_institute_id() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.my_role(), private.my_trainee_id(), private.my_institute_id() to authenticated;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.institutes enable row level security;
alter table public.profiles enable row level security;
alter table public.trainees enable row level security;
alter table public.programmes enable row level security;
alter table public.nominations enable row level security;
alter table public.class_sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.certificates enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;

-- Public catalogue
create policy institutes_read on public.institutes for select to anon, authenticated using (true);
create policy programmes_read on public.programmes for select to anon, authenticated using (true);
create policy programmes_manage on public.programmes for all to authenticated
  using (institute_id = (select private.my_institute_id()) and (select private.my_role()) = 'institute_admin')
  with check (institute_id = (select private.my_institute_id()) and (select private.my_role()) = 'institute_admin');

-- Profiles: yourself only
create policy profiles_self on public.profiles for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_self_update on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and role = (select private.my_role()));  -- can't promote yourself

-- Trainees: yourself, your institute's staff, NCCT, and employers only for
-- people who applied to their jobs or opted in to discovery.
create policy trainees_read on public.trainees for select to authenticated using (
  user_id = (select auth.uid())
  or (select private.my_role()) = 'ncct_admin'
  or (
    (select private.my_role()) in ('trainer', 'institute_admin')
    and exists (
      select 1 from public.nominations n join public.programmes p on p.id = n.programme_id
      where n.trainee_id = trainees.id and p.institute_id = (select private.my_institute_id())
    )
  )
  or (
    (select private.my_role()) = 'employer'
    and (
      open_to_employers
      or exists (
        select 1 from public.applications a join public.jobs j on j.id = a.job_id
        where a.trainee_id = trainees.id and j.employer_id = (select auth.uid())
      )
    )
  )
);
create policy trainees_self_update on public.trainees for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Nominations: the trainee, and the institute running the programme
create policy nominations_read on public.nominations for select to authenticated using (
  trainee_id = (select private.my_trainee_id())
  or nominated_by = (select auth.uid())
  or exists (select 1 from public.programmes p where p.id = programme_id and p.institute_id = (select private.my_institute_id()))
);
create policy nominations_create on public.nominations for insert to authenticated
  with check ((select private.my_role()) in ('society_admin', 'institute_admin') and nominated_by = (select auth.uid()));

-- Sessions and attendance. Attendance rows are written only by the server
-- (service role) after verifying a rotating token, never directly by clients.
create policy sessions_read on public.class_sessions for select to authenticated using (
  trainer_id = (select auth.uid())
  or exists (select 1 from public.nominations n where n.programme_id = class_sessions.programme_id and n.trainee_id = (select private.my_trainee_id()))
);
create policy attendance_read on public.attendance for select to authenticated using (
  trainee_id = (select private.my_trainee_id())
  or exists (select 1 from public.class_sessions s where s.id = session_id and s.trainer_id = (select auth.uid()))
);

-- Lesson progress: your own
create policy progress_own on public.lesson_progress for select to authenticated
  using (trainee_id = (select private.my_trainee_id()));
create policy progress_insert_own on public.lesson_progress for insert to authenticated
  with check (trainee_id = (select private.my_trainee_id()));

-- Certificates: the holder can read theirs. Public verification goes through a
-- server route that returns only what is printed on the certificate.
create policy certificates_own on public.certificates for select to authenticated
  using (trainee_id = (select private.my_trainee_id()));

-- Jobs: anyone signed in can read open jobs; employers manage their own
create policy jobs_read on public.jobs for select to authenticated using (closed_at is null or employer_id = (select auth.uid()));
create policy jobs_manage on public.jobs for all to authenticated
  using (employer_id = (select auth.uid()))
  with check (employer_id = (select auth.uid()) and (select private.my_role()) = 'employer');

-- Applications: the applicant and the job's employer
create policy applications_read on public.applications for select to authenticated using (
  trainee_id = (select private.my_trainee_id())
  or exists (select 1 from public.jobs j where j.id = job_id and j.employer_id = (select auth.uid()))
);
create policy applications_create on public.applications for insert to authenticated
  with check (trainee_id = (select private.my_trainee_id()));
