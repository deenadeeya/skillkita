function isGoogleMapsHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "www.google.com" ||
    host === "google.com" ||
    host === "maps.google.com" ||
    host === "maps.app.goo.gl" ||
    host === "goo.gl" ||
    host.endsWith(".google.com")
  );
}

/** Turn embed/share URLs into a link that opens Google Maps in the browser. */
export function sanitizeGoogleMapsLink(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!isGoogleMapsHost(parsed.hostname)) return null;

    if (parsed.pathname.includes("/maps/embed")) {
      const pb = parsed.searchParams.get("pb");
      if (pb) return `https://www.google.com/maps?pb=${encodeURIComponent(pb)}`;
      return "https://www.google.com/maps";
    }

    if (parsed.pathname.includes("/maps") || parsed.hostname.includes("goo.gl")) {
      return trimmed;
    }

    return null;
  } catch {
    return null;
  }
}

/** Search link when admin only provided an address (no map URL). */
export function googleMapsSearchLink(query: string): string | null {
  const q = query.trim().replace(/\s+/g, " ");
  if (!q) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** @deprecated Use sanitizeGoogleMapsLink — kept for any legacy callers. */
export function sanitizeMapEmbedUrl(url: string | null | undefined): string | null {
  return sanitizeGoogleMapsLink(url);
}
