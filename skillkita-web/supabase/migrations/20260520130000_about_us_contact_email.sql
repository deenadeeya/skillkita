-- About Us contact emails

alter table public.landing_content
  add column if not exists contact_1_email text,
  add column if not exists contact_2_email text;
