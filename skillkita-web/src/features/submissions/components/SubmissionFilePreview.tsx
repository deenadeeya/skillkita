import { useEffect, useState } from "react";
import { getSubmissionFileSignedUrl } from "../submissionsStorage";
import { isImageStoragePath, isPdfStoragePath } from "../submissionFileKind";

type Props = {
  storagePath: string;
  title: string;
};

export function SubmissionFilePreview({ storagePath, title }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);
    setPreviewUrl(null);

    void getSubmissionFileSignedUrl(storagePath)
      .then((url) => {
        if (!cancelled) setPreviewUrl(url);
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : "Could not load preview.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  if (isLoading) {
    return <p className="text-sm text-ink-muted">Loading file preview…</p>;
  }

  if (loadError || !previewUrl) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        {loadError ?? "Preview unavailable. Use View file or Download below."}
      </p>
    );
  }

  if (isPdfStoragePath(storagePath)) {
    return (
      <iframe
        title={title}
        src={previewUrl}
        className="h-[min(70vh,640px)] w-full rounded-lg border border-black/10 bg-white"
      />
    );
  }

  if (isImageStoragePath(storagePath)) {
    return (
      <img
        src={previewUrl}
        alt={title}
        className="max-h-[min(70vh,640px)] w-full rounded-lg border border-black/10 bg-white object-contain"
      />
    );
  }

  return (
    <p className="rounded-lg border border-black/10 bg-primary/5 p-3 text-sm text-ink-muted">
      Inline preview is not available for this file type. Use View file or Download below.
    </p>
  );
}
