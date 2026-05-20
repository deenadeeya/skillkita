-- About Us page: location, bank details, contact persons.

alter table public.landing_content
  add column if not exists location_description text,
  add column if not exists location_map_embed_url text,
  add column if not exists bank_account_details text,
  add column if not exists bank_qr_image_url text,
  add column if not exists contact_1_name text,
  add column if not exists contact_1_phone text,
  add column if not exists contact_2_name text,
  add column if not exists contact_2_phone text,
  add column if not exists contact_1_email text,
  add column if not exists contact_2_email text;
