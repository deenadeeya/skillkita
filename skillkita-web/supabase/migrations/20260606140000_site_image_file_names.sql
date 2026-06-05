-- Original upload filenames for site images (display in admin; storage paths use UUIDs).

alter table public.landing_content
  add column if not exists who_image_file_name text,
  add column if not exists home_featured_3_file_name text,
  add column if not exists bank_qr_file_name text;

alter table public.homepage_hero
  add column if not exists hero_image_file_name text;
