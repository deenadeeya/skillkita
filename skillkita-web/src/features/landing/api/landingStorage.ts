import { getStoragePublicUrl, supabase } from "../../../shared/api/supabaseClient";

export async function uploadSiteAssetWhoImage(file: File) {
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filePath = `who-are-we/${crypto.randomUUID()}.${ext || "png"}`;

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(filePath, file, { upsert: false, contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  return getStoragePublicUrl("site-assets", filePath) || null;
}

/** Home page collage slot 1 (top-left), 2 (top-right), 3 (wide bottom). */
export async function uploadSiteAssetHomeFeatured(file: File, slot: 1 | 2 | 3) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filePath = `home-featured/${slot}/${crypto.randomUUID()}.${ext || "jpg"}`;

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(filePath, file, { upsert: false, contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  return getStoragePublicUrl("site-assets", filePath) || null;
}

export async function uploadSiteAssetBankQr(file: File) {
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filePath = `about-us/bank-qr/${crypto.randomUUID()}.${ext || "png"}`;

  const { error: uploadError } = await supabase.storage
    .from("site-assets")
    .upload(filePath, file, { upsert: false, contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  return getStoragePublicUrl("site-assets", filePath) || null;
}

export async function uploadExperiencePhotos(files: File[]) {
  if (files.length === 0) return [] as string[];

  const urls: string[] = [];
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const filePath = `experiences/${crypto.randomUUID()}.${ext || "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("experience-photos")
      .upload(filePath, file, { upsert: false, contentType: file.type });

    if (uploadError) throw new Error(uploadError.message);

    const publicUrl = getStoragePublicUrl("experience-photos", filePath);
    if (publicUrl) urls.push(publicUrl);
  }

  return urls;
}

