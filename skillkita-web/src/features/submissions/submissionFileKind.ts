const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "gif"]);

export function storagePathExtension(path: string): string {
  const name = path.split("/").pop() ?? "";
  const ext = name.includes(".") ? name.split(".").pop() ?? "" : "";
  return ext.toLowerCase();
}

export function isPdfStoragePath(path: string): boolean {
  return storagePathExtension(path) === "pdf";
}

export function isImageStoragePath(path: string): boolean {
  return IMAGE_EXT.has(storagePathExtension(path));
}
