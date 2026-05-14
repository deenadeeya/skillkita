import { supabase } from "../../shared/api/supabaseClient";
import type { DocumentSubmissionType } from "./types";

const BUCKET = "employer-documents";

function folderForType(t: DocumentSubmissionType): string {
  return t === "jd14" ? "jd14" : "payment_receipt";
}

export async function uploadEmployerSubmissionFile(
  file: File,
  submissionType: DocumentSubmissionType,
  userId: string
): Promise<string> {
  const rawExt = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ext = rawExt || "bin";
  const path = `${folderForType(submissionType)}/${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw new Error(error.message);
  return path;
}

export async function getSubmissionFileSignedUrl(storagePath: string, expiresSeconds = 3600) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, expiresSeconds);
  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error("Could not create download link.");
  return data.signedUrl;
}
