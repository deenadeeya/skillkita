-- Homepage CMS: hero, stats, gallery, testimonials, partners.

create table if not exists public.homepage_hero (
  id int primary key,
  title text not null,
  subtitle text not null,
  hero_image text,
  button_1_text text not null default 'Explore Courses',
  button_1_link text not null default '/courses',
  button_2_text text not null default 'Contact Us',
  button_2_link text not null default '/about-us',
  updated_at timestamptz not null default now()
);

insert into public.homepage_hero (id, title, subtitle)
values (
  1,
  'Empowering Skills Development For Everyone',
  'Accredited TVET training programmes designed to equip individuals and industries with practical skills for the future.'
)
on conflict (id) do nothing;

create table if not exists public.homepage_stats (
  id int primary key,
  students_value int not null default 5000,
  students_suffix text not null default '+',
  students_label text not null default 'Students Trained',
  courses_value int not null default 100,
  courses_suffix text not null default '+',
  courses_label text not null default 'Courses Conducted',
  partners_value int not null default 50,
  partners_suffix text not null default '+',
  partners_label text not null default 'Industry Partners',
  satisfaction_value int not null default 95,
  satisfaction_suffix text not null default '%',
  satisfaction_label text not null default 'Satisfaction Rate',
  updated_at timestamptz not null default now()
);

insert into public.homepage_stats (id) values (1) on conflict (id) do nothing;

create table if not exists public.homepage_gallery (
  id uuid primary key default gen_random_uuid(),
  image text not null,
  category text not null check (category in (
    'Training Sessions',
    'Facilities',
    'Graduation',
    'Industry Collaboration'
  )),
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.homepage_testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text not null,
  photo text,
  review text not null,
  rating int not null default 5 check (rating >= 1 and rating <= 5),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.homepage_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.homepage_hero enable row level security;
alter table public.homepage_stats enable row level security;
alter table public.homepage_gallery enable row level security;
alter table public.homepage_testimonials enable row level security;
alter table public.homepage_partners enable row level security;

drop policy if exists "homepage_hero_select_all" on public.homepage_hero;
create policy "homepage_hero_select_all" on public.homepage_hero for select using (true);

drop policy if exists "homepage_hero_write_admin" on public.homepage_hero;
create policy "homepage_hero_write_admin" on public.homepage_hero for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "homepage_stats_select_all" on public.homepage_stats;
create policy "homepage_stats_select_all" on public.homepage_stats for select using (true);

drop policy if exists "homepage_stats_write_admin" on public.homepage_stats;
create policy "homepage_stats_write_admin" on public.homepage_stats for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "homepage_gallery_select_all" on public.homepage_gallery;
create policy "homepage_gallery_select_all" on public.homepage_gallery for select using (true);

drop policy if exists "homepage_gallery_write_admin" on public.homepage_gallery;
create policy "homepage_gallery_write_admin" on public.homepage_gallery for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "homepage_testimonials_select_all" on public.homepage_testimonials;
create policy "homepage_testimonials_select_all" on public.homepage_testimonials for select using (true);

drop policy if exists "homepage_testimonials_write_admin" on public.homepage_testimonials;
create policy "homepage_testimonials_write_admin" on public.homepage_testimonials for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists "homepage_partners_select_all" on public.homepage_partners;
create policy "homepage_partners_select_all" on public.homepage_partners for select using (true);

drop policy if exists "homepage_partners_write_admin" on public.homepage_partners;
create policy "homepage_partners_write_admin" on public.homepage_partners for all to authenticated
using (public.is_admin()) with check (public.is_admin());
