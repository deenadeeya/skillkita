import { useEffect, useMemo, useState } from "react";
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
  url: string | null | undefined;
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
 * Shows an empty box when no URL is provided or the image fails to load.
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
  const trimmedUrl = url?.trim() ?? "";
  const asPdf = Boolean(trimmedUrl) && (forcePdf || isPosterPdfUrl(trimmedUrl));
  const optimizedSrc = useMemo(
    () => (trimmedUrl ? optimizeImageUrl(trimmedUrl, { width: optimizeWidth }) : ""),
    [trimmedUrl, optimizeWidth]
  );
  const [src, setSrc] = useState(optimizedSrc);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setSrc(optimizedSrc);
    setImageFailed(false);
  }, [optimizedSrc]);

  if (!trimmedUrl) {
    return <div className={className} aria-hidden />;
  }

  if (asPdf) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <object
          data={trimmedUrl}
          type="application/pdf"
          title={alt}
          className="block h-full min-h-[280px] w-full bg-white"
        >
          <a
            href={trimmedUrl}
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

  if (imageFailed) {
    return <div className={className} aria-hidden />;
  }

  const handleImageError = () => {
    if (src === optimizedSrc && optimizedSrc !== trimmedUrl) {
      setSrc(trimmedUrl);
      return;
    }
    setImageFailed(true);
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
