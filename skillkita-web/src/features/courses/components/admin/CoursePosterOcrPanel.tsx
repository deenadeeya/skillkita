import type { ReactNode } from "react";
import PlaceholderPoster from "../../../../assets/placeholder.jpg";
import { CoursePosterMedia } from "../CoursePosterMedia";

type OcrState =
  | { status: "idle" }
  | { status: "running"; progressLabel?: string; progressPct?: number }
  | { status: "error"; message: string }
  | { status: "done" };

type Props = {
  selectedPosterFile: File | null;
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
  isSaving,
  ocrState,
  onPosterChange,
  canRunOcr,
  onRunOcr,
  onClearOcr,
  extra,
}: Props) {
  return (
    <>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Poster</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.pdf,application/pdf"
          onChange={(e) => onPosterChange(e.currentTarget.files?.[0] ?? null)}
          className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px,1fr]">
        <CoursePosterMedia
          url={selectedPosterFile ? URL.createObjectURL(selectedPosterFile) : PlaceholderPoster}
          alt="Poster preview"
          className="aspect-[210/297] w-full rounded-lg object-cover"
        />

        <div className="rounded-xl border border-[#efe1db] bg-white p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#7A1F1F]">Poster OCR (PDF / Image)</p>
              <p className="mt-1 text-xs text-black/70">
                Upload a poster then extract and auto-fill fields. Runs in-browser.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={isSaving || !selectedPosterFile || !canRunOcr || ocrState.status === "running"}
                onClick={onRunOcr}
                className="sk-button-secondary px-3 py-2"
              >
                {ocrState.status === "running" ? "Extracting…" : "Extract text"}
              </button>
              <button
                type="button"
                disabled={ocrState.status === "running"}
                onClick={onClearOcr}
                className="sk-button-secondary px-3 py-2"
              >
                Clear OCR
              </button>
            </div>
          </div>

          <div className="mt-3">
            {ocrState.status === "idle" && (
              <p className="text-xs text-black/60">
                Tip: best results come from high-contrast, text-heavy posters.
              </p>
            )}
            {ocrState.status === "running" && (
              <div className="text-xs text-black/70">
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
    </>
  );
}

