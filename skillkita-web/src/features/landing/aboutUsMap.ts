/** Allow only Google Maps embed iframe src URLs. */
export function sanitizeMapEmbedUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const okHost =
      host === "www.google.com" ||
      host === "google.com" ||
      host.endsWith(".google.com") ||
      host === "maps.google.com";
    if (!okHost || !parsed.pathname.includes("/maps")) {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}
