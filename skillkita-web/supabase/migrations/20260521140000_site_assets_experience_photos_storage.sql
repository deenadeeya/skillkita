-- Public read + admin write for landing CMS and experience photo buckets.
-- Create buckets in Dashboard first: site-assets, experience-photos (both public).

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
