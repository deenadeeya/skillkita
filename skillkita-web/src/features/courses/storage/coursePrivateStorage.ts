import { supabase } from "../../../shared/api/supabaseClient";

export const COURSE_PRIVATE_BUCKET = "course-private-files";

export type PrivateDocKind =
  | "syllabus"
  | "tentative"
  | "trainer_hrd"
  | "trainer_cv";

export const PRIVATE_DOC_LABELS: Record<PrivateDocKind, string> = {
  syllabus: "Syllabus file",
  tentative: "Tentative file",
  trainer_hrd: "Trainer HRD accreditation file",
  trainer_cv: "Trainer CV file",
};

const KIND_TO_COLUMN: Record<
  PrivateDocKind,
  keyof {
    syllabus_storage_path: string | null;
    tentative_storage_path: string | null;
    trainer_hrd_storage_path: string | null;
    trainer_cv_storage_path: string | null;
  }
> = {
  syllabus: "syllabus_storage_path",
  tentative: "tentative_storage_path",
  trainer_hrd: "trainer_hrd_storage_path",
  trainer_cv: "trainer_cv_storage_path",
};

export function storagePathForPrivateFile(
  courseId: string,
  kind: PrivateDocKind,
  file: File
): string {
  const rawExt = file.name.split(".").pop() || "bin";
  const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${courseId}/${kind}/${crypto.randomUUID()}.${ext}`;
}

export async function uploadCoursePrivateFile(
  courseId: string,
  kind: PrivateDocKind,
  file: File
): Promise<string> {
  const path = storagePathForPrivateFile(courseId, kind, file);
  const { error } = await supabase.storage
    .from(COURSE_PRIVATE_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });
  if (error) {
    throw new Error(error.message);
  }
  return path;
}

export function columnForKind(kind: PrivateDocKind): string {
  return KIND_TO_COLUMN[kind];
}

function normalizeStoragePath(path: string): string {
  return path.trim().replace(/^\/+/, "");
}

/**
 * Opens a course document for the current user (including anonymous visitors).
 * Uses direct download + blob URL so public users are not blocked by signed-URL limits.
 */
export async function openCourseDocumentUrl(path: string): Promise<string> {
  const normalized = normalizeStoragePath(path);
  if (!normalized) {
    throw new Error("Invalid file path.");
  }

  const { data: blob, error } = await supabase.storage
    .from(COURSE_PRIVATE_BUCKET)
    .download(normalized);

  if (error) {
    throw new Error(error.message);
  }
  if (!blob) {
    throw new Error("Could not open file.");
  }

  return URL.createObjectURL(blob);
}

/** @deprecated Prefer openCourseDocumentUrl for visitor-safe access. */
export async function createSignedUrlForPath(
  path: string,
  expiresInSeconds = 3600
): Promise<string> {
  const normalized = normalizeStoragePath(path);

  const { data, error } = await supabase.storage
    .from(COURSE_PRIVATE_BUCKET)
    .createSignedUrl(normalized, expiresInSeconds);
  if (error) {
    return openCourseDocumentUrl(normalized);
  }
  if (!data?.signedUrl) {
    throw new Error("Could not create download link.");
  }
  return data.signedUrl;
}

