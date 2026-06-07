import { useEffect, useMemo, useState } from "react";
import { hideImageOnError } from "../../../shared/ui/hideImageOnError";
import type { CoursePrivatePaths } from "../api/privateFilesApi";
import {
  PRIVATE_DOC_LABELS,
  PRIVATE_DOC_TAB_LABELS,
  displayFileNameForKind,
  openCourseDocumentUrl,
  pathForKind,
  previewKindFromStoragePath,
  type PrivateDocKind,
  type PrivateDocPreviewKind,
} from "../storage/coursePrivateStorage";

type Props = {
  privateFiles: CoursePrivatePaths | null;
};

const DOC_KINDS = Object.keys(PRIVATE_DOC_TAB_LABELS) as PrivateDocKind[];

function DocumentPreview({
  previewUrl,
  previewKind,
  title,
}: {
  previewUrl: string;
  previewKind: PrivateDocPreviewKind;
  title: string;
}) {
  if (previewKind === "pdf") {
    return (
      <iframe
        src={previewUrl}
        title={title}
        className="h-[min(70vh,720px)] w-full rounded-card border border-black/10 bg-white"
      />
    );
  }

  if (previewKind === "image") {
    return (
      <div className="flex justify-center rounded-card border border-black/10 bg-white p-4">
        <img
          src={previewUrl}
          alt={title}
          className="max-h-[min(42vh,360px)] max-w-full object-contain"
          onError={hideImageOnError}
        />
      </div>
    );
  }

  return (
    <div className="rounded-card border border-dashed border-black/15 bg-paper px-6 py-6 text-center text-sm text-ink-muted">
      Preview is not available for this file type. Use the download button to open it on your device.
    </div>
  );
}

export function CoursePrivateDocumentsPanel({ privateFiles }: Props) {
  const availableKinds = useMemo(
    () => DOC_KINDS.filter((kind) => Boolean(pathForKind(privateFiles, kind))),
    [privateFiles]
  );
  const hasAnyFile = availableKinds.length > 0;

  const [activeKind, setActiveKind] = useState<PrivateDocKind | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewKind, setPreviewKind] = useState<PrivateDocPreviewKind | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    setActiveKind((current) => {
      if (current && pathForKind(privateFiles, current)) return current;
      return availableKinds[0] ?? null;
    });
  }, [availableKinds, privateFiles]);

  const activePath = activeKind ? pathForKind(privateFiles, activeKind) : null;
  const activeDisplayName = activeKind ? displayFileNameForKind(privateFiles, activeKind) : null;

  useEffect(() => {
    if (!activePath || !activeKind) {
      setPreviewUrl(null);
      setPreviewKind(null);
      setPreviewError(null);
      setIsLoadingPreview(false);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    const displayName = displayFileNameForKind(privateFiles, activeKind);

    const loadPreview = async () => {
      setIsLoadingPreview(true);
      setPreviewError(null);
      setPreviewUrl(null);
      setPreviewKind(null);

      try {
        const url = await openCourseDocumentUrl(activePath, displayName);
        objectUrl = url;
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setPreviewUrl(url);
        setPreviewKind(previewKindFromStoragePath(activePath));
      } catch (error) {
        if (cancelled) return;
        setPreviewError(error instanceof Error ? error.message : "Could not load document.");
      } finally {
        if (!cancelled) setIsLoadingPreview(false);
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [activeKind, activePath, privateFiles]);

  const handleDownload = () => {
    if (!previewUrl || !activePath) return;

    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = activeDisplayName || "document";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <section className="mt-8">
      <h2 className="sk-heading-3 text-primary">Course documents</h2>
      <p className="mt-2 text-sm text-ink-muted">
        Syllabus, tentative schedule, and trainer accreditation materials for this course.
      </p>

      {!hasAnyFile && (
        <p className="mt-4 text-sm text-ink-muted">No documents uploaded for this course yet.</p>
      )}

      {hasAnyFile && (
        <>
          <nav
            className="sk-card mb-2 mt-6 p-2 md:p-3"
            aria-label="Course documents"
            role="tablist"
          >
            <div className="flex flex-wrap gap-2">
              {DOC_KINDS.map((kind) => {
                const path = pathForKind(privateFiles, kind);
                const isActive = activeKind === kind;
                const isDisabled = !path;

                return (
                  <button
                    key={kind}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`course-doc-panel-${kind}`}
                    id={`course-doc-tab-${kind}`}
                    disabled={isDisabled}
                    onClick={() => setActiveKind(kind)}
                    className={[
                      "rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-ink hover:bg-primary/5 hover:text-primary",
                    ].join(" ")}
                  >
                    {PRIVATE_DOC_TAB_LABELS[kind]}
                  </button>
                );
              })}
            </div>
          </nav>

          <div
            className="sk-card p-6 md:p-8"
            role="tabpanel"
            id={activeKind ? `course-doc-panel-${activeKind}` : undefined}
            aria-labelledby={activeKind ? `course-doc-tab-${activeKind}` : undefined}
          >
            {activeKind ? (
              <div className="border-b border-black/5 pb-5">
                <h3 className="sk-section-title">{PRIVATE_DOC_LABELS[activeKind]}</h3>
                
              </div>
            ) : null}

            <div className="mt-6 space-y-4">
              {isLoadingPreview && (
                <div className="rounded-card border border-black/10 bg-paper px-6 py-10 text-center text-sm text-ink-muted">
                  Loading document…
                </div>
              )}

              {previewError && (
                <div className="rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {previewError}
                </div>
              )}

              {!isLoadingPreview && !previewError && previewUrl && previewKind && activeKind ? (
                <DocumentPreview
                  previewUrl={previewUrl}
                  previewKind={previewKind}
                  title={PRIVATE_DOC_LABELS[activeKind]}
                />
              ) : null}

              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!previewUrl || isLoadingPreview || Boolean(previewError)}
                  className="sk-button-primary min-w-[200px] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
