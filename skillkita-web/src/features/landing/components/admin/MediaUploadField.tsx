import type { ChangeEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { hideImageOnError } from "../../../../shared/ui/hideImageOnError";

type Props = {
  id: string;
  label: string;
  hint?: string;
  previewUrl: string;
  previewAlt?: string;
  previewClassName?: string;
  fileName?: string | null;
  isSaving?: boolean;
  onImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  footer?: ReactNode;
};

export function fileNameFromImageUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  try {
    const segment = new URL(url).pathname.split("/").filter(Boolean).pop();
    return segment ? decodeURIComponent(segment) : null;
  } catch {
    const segment = url.split("/").filter(Boolean).pop()?.split("?")[0];
    return segment ? decodeURIComponent(segment) : null;
  }
}

export function getDisplayFileName(
  selectedFile: File | null,
  savedFileName: string | null | undefined,
  savedUrl?: string | null
): string | null {
  if (selectedFile) return selectedFile.name;
  if (savedFileName?.trim()) return savedFileName.trim();
  return fileNameFromImageUrl(savedUrl);
}

export function MediaUploadField({
  id,
  label,
  hint,
  previewUrl,
  previewAlt = "",
  previewClassName = "mt-3 max-h-40 w-full rounded-card object-cover",
  fileName = null,
  isSaving = false,
  onImageChange,
  footer,
}: Props) {
  const displayName = fileName?.trim() || "No file chosen";
  const [previewFailed, setPreviewFailed] = useState(false);
  const hasPreview = Boolean(previewUrl?.trim());

  useEffect(() => {
    setPreviewFailed(false);
  }, [previewUrl]);

  return (
    <div className="rounded-card border border-black/10 bg-paper/50 p-4">
      <label htmlFor={id} className="sk-label">
        {label}
      </label>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-ink-muted">{hint}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label
          htmlFor={id}
          className="sk-button-secondary inline-flex cursor-pointer px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          aria-disabled={isSaving}
        >
          Choose file
        </label>
        <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">{displayName}</span>
        <input
          id={id}
          type="file"
          accept="image/*"
          onChange={onImageChange}
          className="sr-only"
          disabled={isSaving}
        />
      </div>
      {hasPreview && !previewFailed ? (
        <img
          src={previewUrl}
          alt={previewAlt}
          className={previewClassName}
          loading="lazy"
          onError={(event) => {
            setPreviewFailed(true);
            hideImageOnError(event);
          }}
        />
      ) : null}
      {footer}
    </div>
  );
}
