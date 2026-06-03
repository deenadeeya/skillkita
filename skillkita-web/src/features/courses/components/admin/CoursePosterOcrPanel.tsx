import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import PlaceholderPoster from "../../../../assets/placeholder.jpg";
import type { PosterExtractState } from "../../utils/posterExtractState";
import { CoursePosterMedia, isPosterPdfUrl } from "../CoursePosterMedia";

function selectedFileIsPdf(file: File | null): boolean {
  if (!file) return false;
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

type Props = {
  selectedPosterFile: File | null;
  existingPosterUrl?: string | null;
  isSaving: boolean;
  extractState: PosterExtractState;
  onPosterChange: (file: File | null) => void;
  canRunAutoFill: boolean;
  onRunAutoFill: () => void;
  onClearExtract: () => void;
  extra?: ReactNode;
};

export function CoursePosterOcrPanel({
  selectedPosterFile,
  existingPosterUrl = null,
  isSaving,
  extractState,
  onPosterChange,
  canRunAutoFill,
  onRunAutoFill,
  onClearExtract,
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

  const isRunning = extractState.status === "running";
  const progressPct = isRunning ? extractState.progressPct : 0;

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
              <p className="text-sm font-semibold text-primary">Auto-fill from poster</p>

              <p className="mt-1 text-xs text-ink-muted">
                Uses Gemini to read the poster and suggest form values. May be incorrect — please verify
                before saving.
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isSaving || !selectedPosterFile || !canRunAutoFill || isRunning}
                onClick={onRunAutoFill}
                className="sk-button-secondary px-3 py-2 text-sm"
              >
                {isRunning ? "Analyzing…" : "Auto-fill from poster"}
              </button>
              <button
                type="button"
                disabled={isRunning}
                onClick={onClearExtract}
                className="sk-button-secondary px-3 py-2 text-sm"
              >
                Clear status
              </button>
            </div>

            <div className="mt-3">
              {isRunning && (
                <div className="text-xs text-ink-muted" aria-live="polite" aria-busy="true">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-primary">{extractState.progressLabel}</p>
                    <p className="tabular-nums font-semibold text-primary">{progressPct}%</p>
                  </div>
                  <div
                    className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-black/10"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressPct}
                    aria-label="Poster auto-fill progress"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}
              {extractState.status === "error" && (
                <p className="text-xs font-semibold text-red-700">
                  Auto-fill failed: {extractState.message}
                </p>
              )}
              {extractState.status === "done" && (
                <p className="text-xs font-semibold text-emerald-700">
                  Done. Form fields updated from the poster.
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
