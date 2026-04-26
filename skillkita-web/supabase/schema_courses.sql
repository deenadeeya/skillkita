-- Public course catalog. Run before auth_roles_setup.sql (RLS policies reference this table).

create extension if not exists "pgcrypto";

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  details text not null,
  trainer_names text,
  course_time text,
  venue text,
  mycoid text,
  price text,
  contact_person text,
  contact_phone text,
  syllabus text,
  poster_url text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_created_at_idx on public.courses (created_at desc);
create index if not exists courses_is_visible_idx on public.courses (is_visible);
create index if not exists courses_date_idx on public.courses (date);

-- For existing databases, ensure new columns exist (safe re-run).
alter table if exists public.courses add column if not exists trainer_names text;
alter table if exists public.courses add column if not exists course_time text;
alter table if exists public.courses add column if not exists venue text;
alter table if exists public.courses add column if not exists mycoid text;
alter table if exists public.courses add column if not exists price text;
alter table if exists public.courses add column if not exists contact_person text;
alter table if exists public.courses add column if not exists contact_phone text;
alter table if exists public.courses add column if not exists syllabus text;
