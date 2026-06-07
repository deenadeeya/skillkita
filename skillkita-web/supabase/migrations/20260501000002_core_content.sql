-- Public content tables: courses, experiences, landing page CMS.

-- Courses (public catalog)
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date,
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

-- Experiences (gallery)
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date,
  details text not null,
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists experiences_date_idx on public.experiences (date desc);
create index if not exists experiences_created_at_idx on public.experiences (created_at desc);

-- Landing page CMS (singleton row id = 1)
create table if not exists public.landing_content (
  id int primary key,
  cover_description text not null,
  who_image_url text,
  who_image_file_name text,
  who_description text not null,
  location_description text,
  location_map_embed_url text,
  bank_account_details text,
  bank_qr_image_url text,
  bank_qr_file_name text,
  contact_1_name text,
  contact_1_phone text,
  contact_1_email text,
  contact_2_name text,
  contact_2_phone text,
  contact_2_email text,
  company_hr_email text,
  home_featured_1_url text,
  home_featured_2_url text,
  home_featured_3_url text,
  home_featured_3_file_name text,
  social_facebook_page_url text,
  social_facebook_post_urls text,
  social_instagram_profile_url text,
  social_instagram_post_url text,
  social_linkedin_profile_url text,
  updated_at timestamptz not null default now()
);

insert into public.landing_content (id, cover_description, who_description)
values (1, 'Offering HRD-Corp Levy Claimable Training Courses', '...')
on conflict (id) do nothing;
