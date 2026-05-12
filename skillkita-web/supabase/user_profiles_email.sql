-- Mirror auth.users.email onto public.user_profiles for admin lists and reporting.
-- Run in Supabase SQL Editor after auth_roles_setup.sql and auth_profile_trigger.sql.
--
-- If you previously created public.admin_user_profile_emails(), you may drop it:
--   drop function if exists public.admin_user_profile_emails();

alter table public.user_profiles
  add column if not exists email text;

update public.user_profiles up
set email = au.email::text
from auth.users au
where au.id = up.user_id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, full_name, company_name, phone, role, status, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), '—'),
    nullif(trim(coalesce(new.raw_user_meta_data->>'company_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    'employer',
    'pending',
    nullif(trim(coalesce(new.email::text, '')), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create or replace function public.handle_auth_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.user_profiles
    set email = nullif(trim(new.email::text), '')
    where user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  execute function public.handle_auth_user_email_updated();
