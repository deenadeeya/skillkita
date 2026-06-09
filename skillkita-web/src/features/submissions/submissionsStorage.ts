import { supabase } from "../../shared/api/supabaseClient";
import { assertAllowedJd14TemplateFile } from "./jd14TemplateFiles";
import type { DocumentSubmissionType } from "./types";

const BUCKET = "employer-documents";

const JD14_TEMPLATES_PREFIX = "jd14_templates";

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

export async function getSubmissionFileSignedUrl(
  storagePath: string,
  expiresSeconds = 3600,
  options?: { download?: string }
) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresSeconds, options?.download ? { download: options.download } : undefined);
  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error("Could not create download link.");
  return data.signedUrl;
}

/** Admin-only upload path; RLS on storage allows admins full access to employer-documents. */
export async function uploadJd14TemplateFile(file: File): Promise<string> {
  const ext = assertAllowedJd14TemplateFile(file);
  const path = `${JD14_TEMPLATES_PREFIX}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });

  if (error) throw new Error(error.message);
  return path;
}

export async function removeEmployerDocumentStoragePaths(paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(unique);
  if (error) throw new Error(error.message);
}
