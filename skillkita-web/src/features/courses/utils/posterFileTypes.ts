export const POSTER_FILE_ACCEPT = "image/jpeg,image/png,.jpg,.jpeg,.png";

export const POSTER_FILE_TYPE_ERROR = "Course poster must be a PNG or JPEG image.";

export function isAllowedPosterFile(file: File): boolean {
  if (file.type === "image/jpeg" || file.type === "image/png") return true;
  return /\.(jpe?g|png)$/i.test(file.name);
}

/** @deprecated Existing stored posters only — new uploads must be PNG or JPEG. */
export function isPdfPoster(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isImagePoster(file: File) {
  return isAllowedPosterFile(file);
}
