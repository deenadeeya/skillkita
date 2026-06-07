-- Auth profiles, roles, admin helpers, signup triggers, and content RLS.

-- Profiles: role + approval status (source of truth)
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  company_name text,
  company_address text,
  phone text,
  email text,
  short_name text,
  profile_pic_url text,
  role text not null check (role in ('employer', 'admin')),
  status text not null check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id)
);

alter table public.user_profiles enable row level security;

-- Legacy admin_users table (optional compatibility)
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

-- Admin check (deactivated admins lose privileges)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles p
    where p.user_id = auth.uid()
      and p.role = 'admin'
      and p.status = 'approved'
  )
  or exists (
    select 1
    from public.admin_users au
    inner join public.user_profiles p on p.user_id = au.user_id
    where au.user_id = auth.uid()
      and p.status = 'approved'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- admin_users RLS
drop policy if exists "admin_users_select_own" on public.admin_users;
create policy "admin_users_select_own"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "admin_users_select_admin" on public.admin_users;
create policy "admin_users_select_admin"
on public.admin_users for select
to authenticated
using (public.is_admin());

drop policy if exists "admin_users_insert_admin" on public.admin_users;
create policy "admin_users_insert_admin"
on public.admin_users for insert
to authenticated
with check (public.is_admin());

drop policy if exists "admin_users_update_admin" on public.admin_users;
create policy "admin_users_update_admin"
on public.admin_users for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_users_delete_admin" on public.admin_users;
create policy "admin_users_delete_admin"
on public.admin_users for delete
to authenticated
using (public.is_admin());

-- user_profiles RLS
drop policy if exists "profiles_select_own" on public.user_profiles;
create policy "profiles_select_own"
on public.user_profiles for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_select_admin_directory" on public.user_profiles;
create policy "profiles_select_admin_directory"
on public.user_profiles for select
to authenticated
using (role = 'admin');

drop policy if exists "profiles_insert_self" on public.user_profiles;
create policy "profiles_insert_self"
on public.user_profiles for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "profiles_update_own" on public.user_profiles;
create policy "profiles_update_own"
on public.user_profiles for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "profiles_admin_update_all" on public.user_profiles;
create policy "profiles_admin_update_all"
on public.user_profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Content table RLS (requires is_admin())
alter table public.courses enable row level security;

drop policy if exists "courses_select_all" on public.courses;
create policy "courses_select_all"
on public.courses for select
using (true);

drop policy if exists "courses_insert_admin" on public.courses;
create policy "courses_insert_admin"
on public.courses for insert
to authenticated
with check (public.is_admin());

drop policy if exists "courses_update_admin" on public.courses;
create policy "courses_update_admin"
on public.courses for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "courses_delete_admin" on public.courses;
create policy "courses_delete_admin"
on public.courses for delete
to authenticated
using (public.is_admin());

alter table public.landing_content enable row level security;

drop policy if exists "landing_select_all" on public.landing_content;
create policy "landing_select_all"
on public.landing_content for select
using (true);

drop policy if exists "landing_upsert_admin" on public.landing_content;
create policy "landing_upsert_admin"
on public.landing_content for insert
to authenticated
with check (public.is_admin());

drop policy if exists "landing_update_admin" on public.landing_content;
create policy "landing_update_admin"
on public.landing_content for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

alter table public.experiences enable row level security;

drop policy if exists "experiences_select_all" on public.experiences;
create policy "experiences_select_all"
on public.experiences for select
to anon, authenticated
using (true);

drop policy if exists "experiences_insert_admin" on public.experiences;
create policy "experiences_insert_admin"
on public.experiences for insert
to authenticated
with check (public.is_admin());

drop policy if exists "experiences_update_admin" on public.experiences;
create policy "experiences_update_admin"
on public.experiences for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "experiences_delete_admin" on public.experiences;
create policy "experiences_delete_admin"
on public.experiences for delete
to authenticated
using (public.is_admin());

-- Auto-create employer profile on auth signup (bypasses RLS; works without a JWT)
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row
  execute function public.handle_auth_user_email_updated();

-- Backfill email for existing profiles
update public.user_profiles up
set email = au.email::text
from auth.users au
where au.id = up.user_id
  and up.email is null;
