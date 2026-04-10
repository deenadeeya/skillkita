-- Past experiences / gallery entries.

create extension if not exists "pgcrypto";

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  details text not null,
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists experiences_date_idx on public.experiences (date desc);
create index if not exists experiences_created_at_idx on public.experiences (created_at desc);
