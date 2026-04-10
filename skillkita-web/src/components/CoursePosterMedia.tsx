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
};

/**
 * Renders a course poster as an image or embedded PDF (PDFs cannot use <img src>).
 */
export function CoursePosterMedia({
  url,
  alt,
  className,
  forcePdf = false,
}: CoursePosterMediaProps) {
  const asPdf = forcePdf || isPosterPdfUrl(url);

  if (asPdf) {
    return (
      <div className={`overflow-hidden ${className}`}>
        <object
          data={url}
          type="application/pdf"
          title={alt}
          className="block h-full min-h-[280px] w-full bg-white"
        >
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#7A1F1F] underline"
          >
            Open poster (PDF)
          </a>
        </object>
      </div>
    );
  }

  return <img src={url} alt={alt} className={className} />;
}
