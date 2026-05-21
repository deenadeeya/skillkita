-- Landing / About Us images (bucket: site-assets)
-- Experience gallery photos (bucket: experience-photos)
--
-- Prerequisites: auth_roles_setup.sql (public.is_admin()).
--
-- 1) Supabase Dashboard → Storage: create buckets (if missing):
--      - site-assets        → Public bucket ON
--      - experience-photos  → Public bucket ON
--    The app stores public object URLs in landing_content and experiences.photo_urls.
--    Browsers load them with plain <img src> (no JWT), so anonymous read is required.
--
-- 2) With RLS on storage.objects, run the policies below.

-- site-assets: who-are-we, home-featured collage, about-us bank QR
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

-- experience-photos: Manage Experiences uploads
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
