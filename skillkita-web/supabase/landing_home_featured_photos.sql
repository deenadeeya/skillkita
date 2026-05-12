-- Optional home page collage (3 images next to "We provide quality training..." on /).
-- Run in Supabase SQL Editor after schema_landing_content.sql.

alter table public.landing_content
  add column if not exists home_featured_1_url text,
  add column if not exists home_featured_2_url text,
  add column if not exists home_featured_3_url text;
