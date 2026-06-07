import { normalizeSupabaseStorageUrl, supabase } from "../../../shared/api/supabaseClient";

export type HomepageHeroRow = {
  id: number;
  title: string;
  subtitle: string;
  hero_image: string | null;
  hero_image_file_name: string | null;
  button_1_text: string;
  button_1_link: string;
  button_2_text: string;
  button_2_link: string;
  updated_at: string;
};

export type HomepageStatsRow = {
  id: number;
  students_value: number;
  students_suffix: string;
  students_label: string;
  courses_value: number;
  courses_suffix: string;
  courses_label: string;
  partners_value: number;
  partners_suffix: string;
  partners_label: string;
  satisfaction_value: number;
  satisfaction_suffix: string;
  satisfaction_label: string;
  updated_at: string;
};

export type HomepageGalleryRow = {
  id: string;
  image: string;
  category: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

export type HomepageTestimonialRow = {
  id: string;
  name: string;
  position: string;
  photo: string | null;
  review: string;
  rating: number;
  sort_order: number;
  created_at: string;
};

export type HomepagePartnerRow = {
  id: string;
  name: string;
  logo_url: string | null;
  sort_order: number;
  created_at: string;
};

export const DEFAULT_HERO: Omit<HomepageHeroRow, "updated_at"> = {
  id: 1,
  title: "Empowering Skills Development For Everyone",
  subtitle:
    "Accredited TVET training programmes designed to equip individuals and industries with practical skills for the future.",
  hero_image: null,
  hero_image_file_name: null,
  button_1_text: "Explore Courses",
  button_1_link: "/courses",
  button_2_text: "Contact Us",
  button_2_link: "/about-us",
};

export const DEFAULT_STATS: Omit<HomepageStatsRow, "updated_at"> = {
  id: 1,
  students_value: 5000,
  students_suffix: "+",
  students_label: "Students Trained",
  courses_value: 100,
  courses_suffix: "+",
  courses_label: "Courses Conducted",
  partners_value: 50,
  partners_suffix: "+",
  partners_label: "Industry Partners",
  satisfaction_value: 95,
  satisfaction_suffix: "%",
  satisfaction_label: "Satisfaction Rate",
};

function isMissingTableError(message: string) {
  return /does not exist|relation.*not found/i.test(message);
}

export async function getHomepageHero(): Promise<HomepageHeroRow | null> {
  const { data, error } = await supabase.from("homepage_hero").select("*").eq("id", 1).maybeSingle();
  if (error) {
    if (isMissingTableError(error.message)) return null;
    throw new Error(error.message);
  }
  if (!data) return null;
  const row = data as HomepageHeroRow;
  return {
    ...row,
    hero_image: normalizeSupabaseStorageUrl(row.hero_image),
  };
}

export async function upsertHomepageHero(payload: HomepageHeroRow) {
  const { error } = await supabase.from("homepage_hero").upsert(payload);
  if (error) throw new Error(error.message);
}

export async function getHomepageStats(): Promise<HomepageStatsRow | null> {
  const { data, error } = await supabase.from("homepage_stats").select("*").eq("id", 1).maybeSingle();
  if (error) {
    if (isMissingTableError(error.message)) return null;
    throw new Error(error.message);
  }
  return (data as HomepageStatsRow | null) ?? null;
}

export async function upsertHomepageStats(payload: HomepageStatsRow) {
  const { error } = await supabase.from("homepage_stats").upsert(payload);
  if (error) throw new Error(error.message);
}

export async function listHomepageGallery(): Promise<HomepageGalleryRow[]> {
  const { data, error } = await supabase
    .from("homepage_gallery")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingTableError(error.message)) return [];
    throw new Error(error.message);
  }
  return ((data ?? []) as HomepageGalleryRow[]).map((row) => ({
    ...row,
    image: normalizeSupabaseStorageUrl(row.image) ?? row.image,
  }));
}

export async function insertHomepageGallery(payload: {
  image: string;
  category: string;
  caption: string | null;
  sort_order: number;
}) {
  const { error } = await supabase.from("homepage_gallery").insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateHomepageGallery(
  id: string,
  payload: { image: string; category: string; caption: string | null; sort_order: number }
) {
  const { error } = await supabase.from("homepage_gallery").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteHomepageGallery(id: string) {
  const { error } = await supabase.from("homepage_gallery").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listHomepageTestimonials(): Promise<HomepageTestimonialRow[]> {
  const { data, error } = await supabase
    .from("homepage_testimonials")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingTableError(error.message)) return [];
    throw new Error(error.message);
  }
  return ((data ?? []) as HomepageTestimonialRow[]).map((row) => ({
    ...row,
    photo: normalizeSupabaseStorageUrl(row.photo),
  }));
}

export async function insertHomepageTestimonial(payload: {
  name: string;
  position: string;
  photo: string | null;
  review: string;
  rating: number;
  sort_order: number;
}) {
  const { error } = await supabase.from("homepage_testimonials").insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateHomepageTestimonial(
  id: string,
  payload: {
    name: string;
    position: string;
    photo: string | null;
    review: string;
    rating: number;
    sort_order: number;
  }
) {
  const { error } = await supabase.from("homepage_testimonials").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteHomepageTestimonial(id: string) {
  const { error } = await supabase.from("homepage_testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listHomepagePartners(): Promise<HomepagePartnerRow[]> {
  const { data, error } = await supabase
    .from("homepage_partners")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    if (isMissingTableError(error.message)) return [];
    throw new Error(error.message);
  }
  return ((data ?? []) as HomepagePartnerRow[]).map((row) => ({
    ...row,
    logo_url: normalizeSupabaseStorageUrl(row.logo_url),
  }));
}

export async function insertHomepagePartner(payload: {
  name: string;
  logo_url: string | null;
  sort_order: number;
}) {
  const { error } = await supabase.from("homepage_partners").insert(payload);
  if (error) throw new Error(error.message);
}

export async function updateHomepagePartner(
  id: string,
  payload: { name: string; logo_url: string | null; sort_order: number }
) {
  const { error } = await supabase.from("homepage_partners").update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteHomepagePartner(id: string) {
  const { error } = await supabase.from("homepage_partners").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
