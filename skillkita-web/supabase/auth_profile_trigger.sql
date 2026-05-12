-- Create employer profile when a new auth user is created.
-- Run in Supabase SQL Editor (once). Fixes:
--   "new row violates row-level security policy for table user_profiles"
-- when signUp returns no session (e.g. "Confirm email" enabled), because the client
-- then uses the anon role and cannot pass profiles_insert_self (authenticated only).

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
