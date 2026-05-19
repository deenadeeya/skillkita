-- JD14 downloadable templates (admin CRUD; approved employers read).
-- Applied by: supabase db push / linked project migrations.
-- Storage: employer-documents bucket, paths jd14_templates/<uuid>.<ext>

create extension if not exists "pgcrypto";

create table if not exists public.jd14_submission_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_storage_path text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jd14_submission_templates_sort_idx
  on public.jd14_submission_templates (sort_order asc, created_at asc);

alter table public.jd14_submission_templates enable row level security;

grant select, insert, update, delete on table public.jd14_submission_templates to authenticated;
grant all on table public.jd14_submission_templates to service_role;

drop policy if exists "jd14_templates_select_admin_or_employer" on public.jd14_submission_templates;
create policy "jd14_templates_select_admin_or_employer"
on public.jd14_submission_templates for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'employer'
      and up.status = 'approved'
  )
);

drop policy if exists "jd14_templates_insert_admin" on public.jd14_submission_templates;
create policy "jd14_templates_insert_admin"
on public.jd14_submission_templates for insert
to authenticated
with check (public.is_admin());

drop policy if exists "jd14_templates_update_admin" on public.jd14_submission_templates;
create policy "jd14_templates_update_admin"
on public.jd14_submission_templates for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "jd14_templates_delete_admin" on public.jd14_submission_templates;
create policy "jd14_templates_delete_admin"
on public.jd14_submission_templates for delete
to authenticated
using (public.is_admin());

drop policy if exists "employer_documents_employer_jd14_templates_select" on storage.objects;
create policy "employer_documents_employer_jd14_templates_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'employer-documents'
  and split_part(name, '/', 1) = 'jd14_templates'
  and exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'employer'
      and up.status = 'approved'
  )
);

notify pgrst, 'reload schema';
