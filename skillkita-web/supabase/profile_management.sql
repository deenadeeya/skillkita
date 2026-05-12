-- Profile management: short name + profile picture
-- Run in Supabase SQL Editor after auth_roles_setup.sql (needs public.is_admin()).
--
-- Storage bucket required (create in Dashboard → Storage):
--   - bucket name: profile-pics
--   - recommended: Public bucket (so images can be embedded directly)
--
-- Path convention used by the app:
--   <user_id>/<filename>

-- 1) Add columns to user_profiles
alter table public.user_profiles
  add column if not exists short_name text,
  add column if not exists profile_pic_url text;

-- 2) Storage policies (bucket must exist: profile-pics)
-- Note: storage.objects policies are global; keep names distinct.

-- Anyone can read profile pics (public bucket; <img src> without JWT).
drop policy if exists "profile_pics_public_select" on storage.objects;
create policy "profile_pics_public_select"
on storage.objects for select
to public
using (bucket_id = 'profile-pics');

-- Users can upload/update/delete ONLY within their own folder (<uid>/...).
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

-- Admins may manage profile pictures for any user (employer folder paths use that user's id).
drop policy if exists "profile_pics_admin_insert" on storage.objects;
create policy "profile_pics_admin_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-pics'
  and public.is_admin()
);

drop policy if exists "profile_pics_admin_update" on storage.objects;
create policy "profile_pics_admin_update"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-pics'
  and public.is_admin()
)
with check (
  bucket_id = 'profile-pics'
  and public.is_admin()
);

drop policy if exists "profile_pics_admin_delete" on storage.objects;
create policy "profile_pics_admin_delete"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-pics'
  and public.is_admin()
);

