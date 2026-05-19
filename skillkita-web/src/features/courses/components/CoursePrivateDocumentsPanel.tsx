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
    <section className="sk-card mt-6 p-6">
      <h2 className="text-xl font-bold text-[#7A1F1F]">Course documents</h2>
      <p className="mt-2 text-sm text-black/80">
        Syllabus, tentative schedule, and trainer accreditation materials for this course.
      </p>

      {!hasAnyFile && (
        <p className="mt-4 text-sm text-black/60">No documents uploaded for this course yet.</p>
      )}

      {hasAnyFile && (
        <div className="mt-4 flex flex-wrap gap-2">
          {kinds.map((kind) => {
            const col = columnForKind(kind) as keyof CoursePrivatePaths;
            const path = privateFiles?.[col];
            return (
              <button
                key={kind}
                type="button"
                disabled={!path}
                onClick={() => onOpenPrivateDoc(path)}
                className="rounded-md border border-[#7A1F1F] bg-[#f9f5ed] px-3 py-1.5 text-xs font-semibold text-[#7A1F1F] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
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
