import {
  PRIVATE_DOC_LABELS,
  columnForKind,
  type PrivateDocKind,
} from "../storage/coursePrivateStorage";
import type { CoursePrivatePaths } from "../api/privateFilesApi";

type Props = {
  privateFiles: CoursePrivatePaths | null;
  onOpenPrivateDoc: (path: string | null | undefined) => void;
};

export function CoursePrivateDocumentsPanel({ privateFiles, onOpenPrivateDoc }: Props) {
  const kinds = Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[];
  const hasAnyFile = kinds.some((kind) => {
    const col = columnForKind(kind) as keyof CoursePrivatePaths;
    return Boolean(privateFiles?.[col]);
  });

  return (
    <section className="sk-card mt-8 p-6 md:p-8">
      <h2 className="sk-heading-3 text-primary">Course documents</h2>
      <p className="mt-2 text-sm text-ink-muted">
        Syllabus, tentative schedule, and trainer accreditation materials for this course.
      </p>

      {!hasAnyFile && (
        <p className="mt-4 text-sm text-ink-muted">No documents uploaded for this course yet.</p>
      )}

      {hasAnyFile && (
        <div className="mt-6 flex flex-wrap gap-3">
          {kinds.map((kind) => {
            const col = columnForKind(kind) as keyof CoursePrivatePaths;
            const path = privateFiles?.[col];
            return (
              <button
                key={kind}
                type="button"
                disabled={!path}
                onClick={() => onOpenPrivateDoc(path)}
                className="sk-button-secondary min-h-[44px] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                {path ? `Open ${PRIVATE_DOC_LABELS[kind]}` : `${PRIVATE_DOC_LABELS[kind]} (n/a)`}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
