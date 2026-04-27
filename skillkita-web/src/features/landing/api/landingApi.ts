import { supabase } from "../../../shared/api/supabaseClient";

export type LandingContentRow = {
  id: number;
  cover_description: string;
  who_image_url: string | null;
  who_description: string;
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

export async function getLandingContent(id: number) {
  const { data, error } = await supabase
    .from("landing_content")
    .select("id,cover_description,who_image_url,who_description,updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as LandingContentRow | null;
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

