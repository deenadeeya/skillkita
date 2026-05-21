const SUPABASE_OBJECT_PUBLIC = "/storage/v1/object/public/";
const SUPABASE_RENDER_PUBLIC = "/storage/v1/render/image/public/";

const IMAGE_EXT = /\.(avif|gif|jpe?g|png|webp)(\?|#|$)/i;

type OptimizeOptions = {
  width?: number;
  quality?: number;
};

/**
 * Request a smaller Supabase Storage image when possible (Pro plan image transforms).
 * Non-Supabase URLs and PDFs are returned unchanged.
 */
export function optimizeImageUrl(url: string, options: OptimizeOptions = {}): string {
  const trimmed = url?.trim();
  if (!trimmed || !IMAGE_EXT.test(trimmed.split("?")[0])) return trimmed;

  const width = options.width ?? 960;
  const quality = options.quality ?? 75;

  try {
    const parsed = new URL(trimmed);
    const idx = parsed.pathname.indexOf(SUPABASE_OBJECT_PUBLIC);
    if (idx === -1) return trimmed;

    const objectPath = parsed.pathname.slice(idx + SUPABASE_OBJECT_PUBLIC.length);
    parsed.pathname = parsed.pathname.slice(0, idx) + SUPABASE_RENDER_PUBLIC + objectPath;
    parsed.searchParams.set("width", String(width));
    parsed.searchParams.set("quality", String(quality));
    return parsed.toString();
  } catch {
    return trimmed;
  }
}
