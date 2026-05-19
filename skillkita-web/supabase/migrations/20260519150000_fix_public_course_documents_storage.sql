-- Fix public course document access: split RLS so anon never calls is_admin(),
-- and storage read works for visible courses without signed-URL permission issues.

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
