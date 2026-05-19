-- Course documents (syllabus, tentative, trainer files) are public for visible courses.
-- Removes employer access-request gate; visitors and all employers can read without approval.

drop policy if exists "course_private_files_select" on public.course_private_files;
create policy "course_private_files_select"
on public.course_private_files for select
to anon, authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.courses c
    where c.id = course_private_files.course_id
      and c.is_visible = true
  )
);

drop policy if exists "course_private_storage_employer_read" on storage.objects;
drop policy if exists "course_private_storage_public_read" on storage.objects;
create policy "course_private_storage_public_read"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'course-private-files'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.courses c
      where c.is_visible = true
        and name like c.id::text || '/%'
    )
  )
);

-- Access-request workflow is retired (table kept for history; no new inserts from app).
drop policy if exists "eca_insert_employer" on public.employer_course_file_access;
