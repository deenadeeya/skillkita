-- Landing page CMS (typically a single row with id = 1).

create table if not exists public.landing_content (
  id int primary key,
  cover_description text not null,
  who_image_url text,
  who_description text not null,
  updated_at timestamptz not null default now()
);

insert into public.landing_content (id, cover_description, who_description)
values (1, 'Offering HRD-Corp Levy Claimable Training Courses', '...')
on conflict (id) do nothing;
