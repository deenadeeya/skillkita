-- Optional URLs for Facebook Page plugin, embedded posts, and Instagram on the public home page.
ALTER TABLE landing_content
  ADD COLUMN IF NOT EXISTS social_facebook_page_url text,
  ADD COLUMN IF NOT EXISTS social_facebook_post_urls text,
  ADD COLUMN IF NOT EXISTS social_instagram_profile_url text,
  ADD COLUMN IF NOT EXISTS social_instagram_post_url text;
