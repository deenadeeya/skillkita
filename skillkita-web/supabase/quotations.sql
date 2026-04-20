-- Quotation requests: employer submits → admin prices & approves → PDF in storage
-- Run after auth_roles_setup.sql (uses is_admin()). Create Storage bucket: quotation-pdfs (private)

create extension if not exists "pgcrypto";

create table if not exists public.quotation_requests (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_name_snapshot text not null,
  course_name text not null,
  number_of_employers int not null check (number_of_employers > 0),
  proposed_date date not null,
  additional_description text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  company_name text,
  course_booking_date date,
  course_mode text,
  unit_price numeric(12, 2),
  amount_rm numeric(12, 2),
  pdf_storage_path text,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists quotation_requests_employer_idx
  on public.quotation_requests (employer_user_id, created_at desc);

create index if not exists quotation_requests_status_idx
  on public.quotation_requests (status);

alter table public.quotation_requests enable row level security;

drop policy if exists "quotation_select_own" on public.quotation_requests;
create policy "quotation_select_own"
on public.quotation_requests for select
to authenticated
using (employer_user_id = auth.uid() or public.is_admin());

drop policy if exists "quotation_insert_employer" on public.quotation_requests;
create policy "quotation_insert_employer"
on public.quotation_requests for insert
to authenticated
with check (
  employer_user_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1
    from public.user_profiles up
    where up.user_id = auth.uid()
      and up.role = 'employer'
      and up.status = 'approved'
  )
);

-- Admins can create approved quotations (e.g. manual/admin-entered).
-- Note: employers can still only create 'pending' requests for themselves via the policy above.
drop policy if exists "quotation_insert_admin" on public.quotation_requests;
create policy "quotation_insert_admin"
on public.quotation_requests for insert
to authenticated
with check (
  public.is_admin()
  and status = 'approved'
  and reviewed_by = auth.uid()
);

drop policy if exists "quotation_update_admin" on public.quotation_requests;
create policy "quotation_update_admin"
on public.quotation_requests for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Storage: bucket quotation-pdfs, object path {employer_user_id}/{quotation_id}.pdf
drop policy if exists "quotation_pdf_admin_all" on storage.objects;
create policy "quotation_pdf_admin_all"
on storage.objects for all
to authenticated
using (bucket_id = 'quotation-pdfs' and public.is_admin())
with check (bucket_id = 'quotation-pdfs' and public.is_admin());

drop policy if exists "quotation_pdf_employer_read" on storage.objects;
create policy "quotation_pdf_employer_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'quotation-pdfs'
  and name like auth.uid()::text || '/%'
);
