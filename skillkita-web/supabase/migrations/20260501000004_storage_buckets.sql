-- Storage buckets and policies for public assets + profile pictures.
-- Requires: 20260501000003_auth_and_profiles.sql (public.is_admin()).

insert into storage.buckets (id, name, public)
values
  ('course-posters', 'course-posters', true),
  ('profile-pics', 'profile-pics', true),
  ('site-assets', 'site-assets', true),
  ('experience-photos', 'experience-photos', true),
  ('course-private-files', 'course-private-files', false),
  ('employer-documents', 'employer-documents', false),
  ('quotation-pdfs', 'quotation-pdfs', false),
  ('chat-attachments', 'chat-attachments', false)
on conflict (id) do update set public = excluded.public;

-- course-posters: public read, admin write
drop policy if exists "course_posters_public_select" on storage.objects;
create policy "course_posters_public_select"
on storage.objects for select
to public
using (bucket_id = 'course-posters');

drop policy if exists "course_posters_storage_admin_all" on storage.objects;
create policy "course_posters_storage_admin_all"
on storage.objects for all
to authenticated
using (bucket_id = 'course-posters' and public.is_admin())
with check (bucket_id = 'course-posters' and public.is_admin());

-- profile-pics: public read; users manage their own folder (<uid>/...)
drop policy if exists "profile_pics_public_select" on storage.objects;
create policy "profile_pics_public_select"
on storage.objects for select
to public
using (bucket_id = 'profile-pics');

drop policy if exists "profile_pics_owner_insert" on storage.objects;
create policy "profile_pics_owner_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-pics'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "profile_pics_owner_update" on storage.objects;
create policy "profile_pics_owner_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-pics'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'profile-pics'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "profile_pics_owner_delete" on storage.objects;
create policy "profile_pics_owner_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-pics'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "profile_pics_admin_insert" on storage.objects;
create policy "profile_pics_admin_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'profile-pics' and public.is_admin());

drop policy if exists "profile_pics_admin_update" on storage.objects;
create policy "profile_pics_admin_update"
on storage.objects for update
to authenticated
using (bucket_id = 'profile-pics' and public.is_admin())
with check (bucket_id = 'profile-pics' and public.is_admin());

drop policy if exists "profile_pics_admin_delete" on storage.objects;
create policy "profile_pics_admin_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'profile-pics' and public.is_admin());

-- site-assets: landing / about-us images
drop policy if exists "site_assets_public_select" on storage.objects;
create policy "site_assets_public_select"
on storage.objects for select
to public
using (bucket_id = 'site-assets');

drop policy if exists "site_assets_storage_admin_all" on storage.objects;
create policy "site_assets_storage_admin_all"
on storage.objects for all
to authenticated
using (bucket_id = 'site-assets' and public.is_admin())
with check (bucket_id = 'site-assets' and public.is_admin());

-- experience-photos: experience gallery uploads
drop policy if exists "experience_photos_public_select" on storage.objects;
create policy "experience_photos_public_select"
on storage.objects for select
to public
using (bucket_id = 'experience-photos');

drop policy if exists "experience_photos_storage_admin_all" on storage.objects;
create policy "experience_photos_storage_admin_all"
on storage.objects for all
to authenticated
using (bucket_id = 'experience-photos' and public.is_admin())
with check (bucket_id = 'experience-photos' and public.is_admin());
