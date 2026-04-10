-- Public course catalog. Run before auth_roles_setup.sql (RLS policies reference this table).

create extension if not exists "pgcrypto";

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  details text not null,
  poster_url text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_created_at_idx on public.courses (created_at desc);
create index if not exists courses_is_visible_idx on public.courses (is_visible);
create index if not exists courses_date_idx on public.courses (date);
