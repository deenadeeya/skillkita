-- Course documents (syllabus, tentative, trainer files) stored in private bucket; public read for visible courses
-- Run in Supabase SQL Editor after courses + user_profiles exist.
-- Create Storage bucket in Dashboard: course-private-files (private)

create extension if not exists "pgcrypto";

-- 1) One row per course (paths are storage object keys, not public URLs)
create table if not exists public.course_private_files (
  course_id uuid primary key references public.courses(id) on delete cascade,
  syllabus_storage_path text,
  tentative_storage_path text,
  trainer_hrd_storage_path text,
  trainer_cv_storage_path text,
  updated_at timestamptz not null default now()
);

alter table public.course_private_files enable row level security;

-- Legacy: employer access requests (retired; app no longer uses this table)
create table if not exists public.employer_course_file_access (
  id uuid primary key default gen_random_uuid(),
  employer_user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  unique (employer_user_id, course_id)
);

alter table public.employer_course_file_access enable row level security;

-- 2) RLS: course_private_files — admin writes; public read for visible courses
drop policy if exists "course_private_files_select" on public.course_private_files;
drop policy if exists "course_private_files_select_visible" on public.course_private_files;
drop policy if exists "course_private_files_select_admin" on public.course_private_files;

create policy "course_private_files_select_visible"
on public.course_private_files for select
to anon, authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = course_private_files.course_id
      and c.is_visible = true
  )
);

create policy "course_private_files_select_admin"
on public.course_private_files for select
to authenticated
using (public.is_admin());

drop policy if exists "course_private_files_all_admin" on public.course_private_files;
create policy "course_private_files_all_admin"
on public.course_private_files for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 3) RLS: employer_course_file_access
drop policy if exists "eca_select" on public.employer_course_file_access;
create policy "eca_select"
on public.employer_course_file_access for select
to authenticated
using (employer_user_id = auth.uid() or public.is_admin());

drop policy if exists "eca_insert_employer" on public.employer_course_file_access;

drop policy if exists "eca_update_admin" on public.employer_course_file_access;
create policy "eca_update_admin"
on public.employer_course_file_access for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- 4) Storage bucket policies (bucket must exist: course-private-files, private)
-- Run after creating the bucket in Storage UI.

drop policy if exists "course_private_storage_admin_all" on storage.objects;
create policy "course_private_storage_admin_all"
on storage.objects for all
to authenticated
using (bucket_id = 'course-private-files' and public.is_admin())
with check (bucket_id = 'course-private-files' and public.is_admin());

drop policy if exists "course_private_storage_employer_read" on storage.objects;
drop policy if exists "course_private_storage_public_read" on storage.objects;
drop policy if exists "course_private_storage_visible_read" on storage.objects;
drop policy if exists "course_private_storage_admin_read" on storage.objects;

create policy "course_private_storage_visible_read"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'course-private-files'
  and exists (
    select 1
    from public.courses c
    where c.is_visible = true
      and storage.objects.name like c.id::text || '/%'
  )
);

create policy "course_private_storage_admin_read"
on storage.objects for select
to authenticated
using (
  bucket_id = 'course-private-files'
  and public.is_admin()
);
