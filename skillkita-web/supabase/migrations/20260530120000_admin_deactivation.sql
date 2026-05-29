-- Deactivated admins (user_profiles.status = 'rejected') lose admin privileges.

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
