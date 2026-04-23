-- Quotation requests: employer submits → admin prices & approves → PDF in storage
-- Run after auth_roles_setup.sql (uses is_admin()). Create Storage bucket: quotation-pdfs (private)

create extension if not exists "pgcrypto";

-- Human-friendly sequential quotation number (unique), used on the PDF.
-- This is separate from the UUID primary key.
create sequence if not exists public.quotation_requests_no_seq;

create table if not exists public.quotation_requests (
  id uuid primary key default gen_random_uuid(),
  quotation_no bigint not null default nextval('public.quotation_requests_no_seq'),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  company_name_snapshot text not null,
  company_address text,
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

-- Forward-compatible: if the table already exists, ensure columns exist.
alter table public.quotation_requests
  add column if not exists quotation_no bigint,
  add column if not exists company_address text;

alter table public.quotation_requests
  alter column quotation_no set default nextval('public.quotation_requests_no_seq');

-- Backfill existing rows that predate quotation_no.
update public.quotation_requests
set quotation_no = nextval('public.quotation_requests_no_seq')
where quotation_no is null;

create unique index if not exists quotation_requests_quotation_no_uq
  on public.quotation_requests (quotation_no);

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

drop policy if exists "quotation_delete_admin" on public.quotation_requests;
create policy "quotation_delete_admin"
on public.quotation_requests for delete
to authenticated
using (public.is_admin());

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
