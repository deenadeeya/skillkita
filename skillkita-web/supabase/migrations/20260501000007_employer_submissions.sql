-- JD14 & payment receipt submissions + downloadable JD14 templates.
-- Requires: public.is_admin(), user_profiles, employer-documents bucket.

create table if not exists public.employer_document_submissions (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  submission_type text not null check (submission_type in ('jd14', 'payment_receipt')),
  course_name text not null,
  proposed_date date not null,
  file_storage_path text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employer_doc_sub_employer_type_idx
  on public.employer_document_submissions (employer_user_id, submission_type, created_at desc);

create index if not exists employer_doc_sub_status_idx
  on public.employer_document_submissions (status, submission_type);

drop index if exists public.employer_doc_sub_one_pending_per_type;

alter table public.employer_document_submissions enable row level security;

drop policy if exists "employer_doc_sub_select" on public.employer_document_submissions;
create policy "employer_doc_sub_select"
on public.employer_document_submissions for select
to authenticated
using (employer_user_id = auth.uid() or public.is_admin());

drop policy if exists "employer_doc_sub_insert_employer" on public.employer_document_submissions;
create policy "employer_doc_sub_insert_employer"
on public.employer_document_submissions for insert
to authenticated
with check (
  employer_user_id = auth.uid()
  and status = 'pending'
  and submission_type in ('jd14', 'payment_receipt')
  and exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'employer'
      and up.status = 'approved'
  )
);

drop policy if exists "employer_doc_sub_update_admin" on public.employer_document_submissions;
create policy "employer_doc_sub_update_admin"
on public.employer_document_submissions for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Storage paths: jd14/<user_id>/... or payment_receipt/<user_id>/...
drop policy if exists "employer_documents_admin_all" on storage.objects;
create policy "employer_documents_admin_all"
on storage.objects for all
to authenticated
using (bucket_id = 'employer-documents' and public.is_admin())
with check (bucket_id = 'employer-documents' and public.is_admin());

drop policy if exists "employer_documents_employer_select" on storage.objects;
create policy "employer_documents_employer_select"
on storage.objects for select
to authenticated
using (
  bucket_id = 'employer-documents'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 1) in ('jd14', 'payment_receipt')
);

drop policy if exists "employer_documents_employer_insert" on storage.objects;
create policy "employer_documents_employer_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'employer-documents'
  and split_part(name, '/', 2) = auth.uid()::text
  and split_part(name, '/', 1) in ('jd14', 'payment_receipt')
);

-- JD14 downloadable templates (admin CRUD; approved employers read)
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
