import { getStoragePublicUrl, supabase } from "../../shared/api/supabaseClient";

export const PROFILE_PICS_BUCKET = "profile-pics" as const;

export async function uploadProfilePic(userId: string, file: File) {
  const safeName = file.name.replaceAll("/", "_").replaceAll("\\", "_");
  const path = `${userId}/${Date.now()}_${safeName}`;

  const { error } = await supabase.storage
    .from(PROFILE_PICS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || undefined });

  if (error) throw error;

  return getStoragePublicUrl(PROFILE_PICS_BUCKET, path);
}

