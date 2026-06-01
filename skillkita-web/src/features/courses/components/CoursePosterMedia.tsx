import { useEffect, useMemo, useState } from "react";
import PlaceholderPoster from "../../../assets/placeholder.jpg";
import { optimizeImageUrl } from "../../../shared/media/optimizeImageUrl";

/** True when URL path ends in .pdf (Supabase public URLs include the file extension). */
export function isPosterPdfUrl(url: string): boolean {
  if (!url) return false;
  try {
    const path = new URL(url, "https://local.invalid").pathname.toLowerCase();
    return path.endsWith(".pdf");
  } catch {
    return url.split("?")[0].split("#")[0].toLowerCase().endsWith(".pdf");
  }
}

type CoursePosterMediaProps = {
  url: string;
  alt: string;
  /** Applied to <img> or to the PDF wrapper (keep layout classes like w-full, mt-4, rounded-*). */
  className: string;
  /**
   * Local blob: URLs do not end in .pdf; set true when the selected file is a PDF.
   */
  forcePdf?: boolean;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  /** Max width sent to Supabase image transform (when supported). */
  optimizeWidth?: number;
};

/**
 * Renders a course poster as an image or embedded PDF (PDFs cannot use <img src>).
 */
export function CoursePosterMedia({
  url,
  alt,
  className,
  forcePdf = false,
  loading = "lazy",
  fetchPriority,
  optimizeWidth = 720,
}: CoursePosterMediaProps) {
  const displayUrl = url?.trim() || PlaceholderPoster;
  const asPdf = forcePdf || isPosterPdfUrl(displayUrl);
  const optimizedSrc = useMemo(
    () => optimizeImageUrl(displayUrl, { width: optimizeWidth }),
    [displayUrl, optimizeWidth]
  );
  const [src, setSrc] = useState(optimizedSrc);

  // Home page (and other screens) pass URLs after async Supabase fetch — sync img src when url changes.
  useEffect(() => {
    setSrc(optimizedSrc);
  }, [optimizedSrc]);

  if (asPdf) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <object
          data={displayUrl}
          type="application/pdf"
          title={alt}
          className="block h-full min-h-[280px] w-full bg-white"
        >
          <a
            href={displayUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary underline"
          >
            Open poster (PDF)
          </a>
        </object>
      </div>
    );
  }

  const handleImageError = () => {
    if (src === optimizedSrc && optimizedSrc !== displayUrl) {
      setSrc(displayUrl);
      return;
    }
    if (src !== PlaceholderPoster) {
      setSrc(PlaceholderPoster);
    }
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      onError={handleImageError}
    />
  );
}
