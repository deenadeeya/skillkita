-- New employer signups are approved immediately (no admin gate on account creation).
-- Existing pending employers are backfilled so they can access the app without waiting.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    user_id,
    full_name,
    company_name,
    phone,
    role,
    status,
    approved_at,
    email
  )
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), '—'),
    nullif(trim(coalesce(new.raw_user_meta_data->>'company_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), ''),
    'employer',
    'approved',
    now(),
    nullif(trim(coalesce(new.email::text, '')), '')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

update public.user_profiles
set
  status = 'approved',
  approved_at = coalesce(approved_at, now())
where role = 'employer'
  and status = 'pending';
