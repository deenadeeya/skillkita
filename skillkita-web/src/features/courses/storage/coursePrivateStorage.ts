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

export const PRIVATE_DOC_TAB_LABELS: Record<PrivateDocKind, string> = {
  syllabus: "Syllabus",
  tentative: "Tentative",
  trainer_hrd: "Trainer HRD",
  trainer_cv: "Trainer CV",
};

export type PrivateDocPreviewKind = "pdf" | "image" | "unsupported";

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

const KIND_TO_FILE_NAME_COLUMN: Record<
  PrivateDocKind,
  | "syllabus_file_name"
  | "tentative_file_name"
  | "trainer_hrd_file_name"
  | "trainer_cv_file_name"
> = {
  syllabus: "syllabus_file_name",
  tentative: "tentative_file_name",
  trainer_hrd: "trainer_hrd_file_name",
  trainer_cv: "trainer_cv_file_name",
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

export function fileNameColumnForKind(kind: PrivateDocKind): string {
  return KIND_TO_FILE_NAME_COLUMN[kind];
}

export function fileNameFromStoragePath(path: string): string {
  const segment = path.split("/").filter(Boolean).pop();
  return segment ? decodeURIComponent(segment) : "document";
}

export function previewKindFromStoragePath(path: string): PrivateDocPreviewKind {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  return "unsupported";
}

export function pathForKind(
  privateFiles: {
    syllabus_storage_path: string | null;
    tentative_storage_path: string | null;
    trainer_hrd_storage_path: string | null;
    trainer_cv_storage_path: string | null;
  } | null,
  kind: PrivateDocKind
): string | null {
  if (!privateFiles) return null;
  const col = columnForKind(kind) as keyof typeof privateFiles;
  const path = privateFiles[col];
  return typeof path === "string" && path.trim() ? path : null;
}

export function displayFileNameForKind(
  privateFiles: {
    syllabus_file_name?: string | null;
    tentative_file_name?: string | null;
    trainer_hrd_file_name?: string | null;
    trainer_cv_file_name?: string | null;
    syllabus_storage_path: string | null;
    tentative_storage_path: string | null;
    trainer_hrd_storage_path: string | null;
    trainer_cv_storage_path: string | null;
  } | null,
  kind: PrivateDocKind
): string | null {
  if (!privateFiles) return null;
  const nameCol = fileNameColumnForKind(kind) as keyof typeof privateFiles;
  const saved = privateFiles[nameCol];
  if (typeof saved === "string" && saved.trim()) return saved.trim();
  const path = pathForKind(privateFiles, kind);
  return path ? fileNameFromStoragePath(path) : null;
}

function normalizeStoragePath(path: string): string {
  return path.trim().replace(/^\/+/, "");
}

/**
 * Opens a course document for the current user (including anonymous visitors).
 * Uses direct download + blob URL so public users are not blocked by signed-URL limits.
 */
export async function openCourseDocumentUrl(
  path: string,
  displayName?: string | null
): Promise<string> {
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

  const name = displayName?.trim() || fileNameFromStoragePath(normalized);
  const file = new File([blob], name, { type: blob.type || "application/octet-stream" });
  return URL.createObjectURL(file);
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

