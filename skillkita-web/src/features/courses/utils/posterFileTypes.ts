export function isPdfPoster(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

export function isImagePoster(file: File) {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
}
