import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import PlaceholderPoster from "../../../../assets/placeholder.jpg";
import { CoursePosterMedia, isPosterPdfUrl } from "../CoursePosterMedia";

function selectedFileIsPdf(file: File | null): boolean {
  if (!file) return false;
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

type OcrState =
  | { status: "idle" }
  | { status: "running"; progressLabel?: string; progressPct?: number }
  | { status: "error"; message: string }
  | { status: "done" };

type Props = {
  selectedPosterFile: File | null;
  existingPosterUrl?: string | null;
  isSaving: boolean;
  ocrState: OcrState;
  onPosterChange: (file: File | null) => void;
  canRunOcr: boolean;
  onRunOcr: () => void;
  onClearOcr: () => void;
  extra?: ReactNode;
};

export function CoursePosterOcrPanel({
  selectedPosterFile,
  existingPosterUrl = null,
  isSaving,
  ocrState,
  onPosterChange,
  canRunOcr,
  onRunOcr,
  onClearOcr,
  extra,
}: Props) {
  const objectPreviewUrl = useMemo(() => {
    if (!selectedPosterFile) return null;
    return URL.createObjectURL(selectedPosterFile);
  }, [selectedPosterFile]);

  useEffect(() => {
    return () => {
      if (objectPreviewUrl) URL.revokeObjectURL(objectPreviewUrl);
    };
  }, [objectPreviewUrl]);

  const displayUrl = objectPreviewUrl ?? existingPosterUrl ?? PlaceholderPoster;
  const forcePdf =
    selectedFileIsPdf(selectedPosterFile) ||
    (!selectedPosterFile && existingPosterUrl != null && isPosterPdfUrl(existingPosterUrl));

  return (
    <div className="rounded-xl border border-black/10 bg-white p-3 lg:p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,420px),auto] lg:items-stretch lg:gap-6">
        <div className="min-w-0 space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-primary">Poster (Image or PDF)</span>
            <p className="mt-1 text-xs text-ink-muted">
                For better display, upload image poster in PNG or JPEG format.
              </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.pdf,application/pdf"
              onChange={(e) => onPosterChange(e.currentTarget.files?.[0] ?? null)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
            />
            {existingPosterUrl && !selectedPosterFile ? (
              <p className="mt-1 text-xs text-ink-muted">
                Current poster is shown in the preview. Choose a file to replace it.
              </p>
            ) : null}
          </label>

          <div className="border-t border-black/10 pt-3">
            <div>
              <p className="text-sm font-semibold text-primary">Poster OCR
              
              </p>
              
              <p className="mt-1 text-xs text-ink-muted">
                Extract text from poster and suggested input will auto-fill fields. May be incorrect, please verify.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isSaving || !selectedPosterFile || !canRunOcr || ocrState.status === "running"}
                onClick={onRunOcr}
                className="sk-button-secondary px-3 py-2 text-sm"
              >
                {ocrState.status === "running" ? "Extracting…" : "Extract Text"}
              </button>
              <button
                type="button"
                disabled={ocrState.status === "running"}
                onClick={onClearOcr}
                className="sk-button-secondary px-3 py-2 text-sm"
              >
                Clear Extracted Text
              </button>
            </div>

            <div className="mt-3">
              {ocrState.status === "running" && (
                <div className="text-xs text-ink-muted">
                  <p className="font-semibold">{ocrState.progressLabel}</p>
                  {typeof ocrState.progressPct === "number" && (
                    <p className="mt-1">Progress: {ocrState.progressPct}%</p>
                  )}
                </div>
              )}
              {ocrState.status === "error" && (
                <p className="text-xs font-semibold text-red-700">OCR failed: {ocrState.message}</p>
              )}
              {ocrState.status === "done" && (
                <p className="text-xs font-semibold text-emerald-700">
                  OCR done. Fields updated from extracted text.
                </p>
              )}
            </div>

            {extra}
          </div>
        </div>

        <div className="flex w-full justify-center border-t border-black/10 pt-4 lg:sticky lg:top-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
          <CoursePosterMedia
            url={displayUrl}
            alt="Poster preview"
            className="aspect-[210/297] w-full max-w-[180px] rounded-lg object-cover sm:max-w-[200px]"
            forcePdf={forcePdf}
          />
        </div>
      </div>
    </div>
  );
}

