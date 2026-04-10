-- Course poster images (bucket: course-posters)
--
-- 1) In Supabase Dashboard → Storage: create bucket "course-posters" and turn ON "Public bucket".
--    The app stores getPublicUrl() URLs in courses.poster_url; browsers load them without a JWT,
--    so objects must be anonymously readable.
--
-- 2) With RLS on storage.objects, you still need policies below.

-- Anyone can read poster files (landing page / course list use plain <img src={url}>).
drop policy if exists "course_posters_public_select" on storage.objects;
create policy "course_posters_public_select"
on storage.objects for select
to public
using (bucket_id = 'course-posters');

-- Only admins can upload, replace, or delete poster objects.
drop policy if exists "course_posters_storage_admin_all" on storage.objects;
create policy "course_posters_storage_admin_all"
on storage.objects for all
to authenticated
using (bucket_id = 'course-posters' and public.is_admin())
with check (bucket_id = 'course-posters' and public.is_admin());
