-- Home page photo collage (Manage Home → three collage slots).

alter table public.landing_content
  add column if not exists home_featured_1_url text,
  add column if not exists home_featured_2_url text,
  add column if not exists home_featured_3_url text;
