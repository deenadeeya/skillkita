-- LinkedIn profile URL for site footer social links.

alter table public.landing_content
  add column if not exists social_linkedin_profile_url text;
