import { supabase } from "../../../shared/api/supabaseClient";

export type LandingContentRow = {
  id: number;
  cover_description: string;
  who_image_url: string | null;
  who_description: string;
  /** Home page collage: top-left, top-right, wide bottom (public URLs in site-assets). */
  home_featured_1_url: string | null;
  home_featured_2_url: string | null;
  home_featured_3_url: string | null;
  /** Facebook Page URL for the home page Page Plugin (e.g. https://www.facebook.com/yourpage). */
  social_facebook_page_url: string | null;
  /** One public Facebook post URL per line (embedded posts). */
  social_facebook_post_urls: string | null;
  /** Link to the public Instagram profile (used for “follow” when no post embed). */
  social_instagram_profile_url: string | null;
  /** One public Instagram post/reel URL per line (official embeds). */
  social_instagram_post_url: string | null;
  /** About Us — location, bank, contacts */
  location_description: string | null;
  location_map_embed_url: string | null;
  bank_account_details: string | null;
  bank_qr_image_url: string | null;
  contact_1_name: string | null;
  contact_1_phone: string | null;
  contact_1_email: string | null;
  contact_2_name: string | null;
  contact_2_phone: string | null;
  contact_2_email: string | null;
  company_hr_email: string | null;
  updated_at: string;
};

export type ExperienceRow = {
  id: string;
  name: string;
  date: string;
  details: string;
  photo_urls: string[] | null;
  created_at: string;
};

const LANDING_SELECT_SOCIAL =
  "id,cover_description,who_image_url,who_description,home_featured_1_url,home_featured_2_url,home_featured_3_url,social_facebook_page_url,social_facebook_post_urls,social_instagram_profile_url,social_instagram_post_url,updated_at";

const LANDING_SELECT_FULL = `${LANDING_SELECT_SOCIAL},location_description,location_map_embed_url,bank_account_details,bank_qr_image_url,contact_1_name,contact_1_phone,contact_1_email,contact_2_name,contact_2_phone,contact_2_email,company_hr_email`;

const LANDING_SELECT_FEATURED =
  "id,cover_description,who_image_url,who_description,home_featured_1_url,home_featured_2_url,home_featured_3_url,updated_at";

const LANDING_SELECT_LEGACY = "id,cover_description,who_image_url,who_description,updated_at";

type AboutUsFields =
  | "location_description"
  | "location_map_embed_url"
  | "bank_account_details"
  | "bank_qr_image_url"
  | "contact_1_name"
  | "contact_1_phone"
  | "contact_2_name"
  | "contact_2_phone";

function applyNullAbout(data: unknown): LandingContentRow {
  const r = data as Omit<LandingContentRow, AboutUsFields>;
  return {
    ...r,
    location_description: null,
    location_map_embed_url: null,
    bank_account_details: null,
    bank_qr_image_url: null,
    contact_1_name: null,
    contact_1_phone: null,
    contact_1_email: null,
    contact_2_name: null,
    contact_2_phone: null,
    contact_2_email: null,
    company_hr_email: null,
  };
}

function applyNullSocial(data: unknown): LandingContentRow {
  const r = data as Omit<
    LandingContentRow,
    | "social_facebook_page_url"
    | "social_facebook_post_urls"
    | "social_instagram_profile_url"
    | "social_instagram_post_url"
  >;
  return {
    ...r,
    social_facebook_page_url: null,
    social_facebook_post_urls: null,
    social_instagram_profile_url: null,
    social_instagram_post_url: null,
  };
}

function applyNullFeaturedAndSocial(data: unknown): LandingContentRow {
  const r = data as Omit<
    LandingContentRow,
    | "home_featured_1_url"
    | "home_featured_2_url"
    | "home_featured_3_url"
    | "social_facebook_page_url"
    | "social_facebook_post_urls"
    | "social_instagram_profile_url"
    | "social_instagram_post_url"
  >;
  return {
    ...r,
    home_featured_1_url: null,
    home_featured_2_url: null,
    home_featured_3_url: null,
    social_facebook_page_url: null,
    social_facebook_post_urls: null,
    social_instagram_profile_url: null,
    social_instagram_post_url: null,
  };
}

export async function getLandingContent(id: number) {
  const fetchRow = async (columns: string) =>
    await supabase.from("landing_content").select(columns).eq("id", id).maybeSingle();

  const full = await fetchRow(LANDING_SELECT_FULL);
  if (!full.error) {
    return (full.data ?? null) as LandingContentRow | null;
  }

  const social = await fetchRow(LANDING_SELECT_SOCIAL);
  if (!social.error) {
    return social.data ? applyNullAbout(social.data) : null;
  }

  const featured = await fetchRow(LANDING_SELECT_FEATURED);
  if (!featured.error) {
    return featured.data ? applyNullAbout(applyNullSocial(featured.data)) : null;
  }

  const legacy = await fetchRow(LANDING_SELECT_LEGACY);
  if (!legacy.error) {
    return legacy.data ? applyNullAbout(applyNullFeaturedAndSocial(legacy.data)) : null;
  }

  throw new Error(legacy.error?.message ?? full.error.message);
}

export async function upsertLandingContent(payload: LandingContentRow) {
  const { error } = await supabase.from("landing_content").upsert(payload);
  if (error) throw new Error(error.message);
}

export async function listExperiences() {
  const { data, error } = await supabase
    .from("experiences")
    .select("id,name,date,details,photo_urls,created_at")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as ExperienceRow[];
}

export async function insertExperience(payload: {
  name: string;
  date: string;
  details: string;
  photo_urls: string[];
}) {
  const { error } = await supabase.from("experiences").insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateExperience(
  id: string,
  payload: { name: string; date: string; details: string; photo_urls: string[] }
) {
  const { error } = await supabase.from("experiences").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteExperience(id: string) {
  const { error } = await supabase.from("experiences").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
