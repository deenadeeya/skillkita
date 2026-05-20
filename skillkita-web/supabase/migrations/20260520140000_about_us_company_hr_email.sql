-- About Us: company HR email (separate from contact person emails)

alter table public.landing_content
  add column if not exists company_hr_email text;
