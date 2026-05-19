import {
  PRIVATE_DOC_LABELS,
  columnForKind,
  type PrivateDocKind,
} from "../../storage/coursePrivateStorage";

type CoursePrivatePaths = {
  syllabus_storage_path: string | null;
  tentative_storage_path: string | null;
  trainer_hrd_storage_path: string | null;
  trainer_cv_storage_path: string | null;
};

type Props = {
  privateSelections: Record<PrivateDocKind, File | null>;
  onPickFile: (kind: PrivateDocKind, file: File | null) => void;
  editingId: string | null;
  existingPrivatePaths: CoursePrivatePaths | null;
  onOpenExisting: (path: string | null | undefined) => void;
};

export function CoursePrivateDocumentsPicker({
  privateSelections,
  onPickFile,
  editingId,
  existingPrivatePaths,
  onOpenExisting,
}: Props) {
  return (
    <div className="rounded-xl border border-[#efe1db] bg-[#f9f5ed] p-3">
      <p className="text-sm font-semibold text-[#7A1F1F]">Course documents</p>
      <p className="mt-1 text-xs text-black/75">
        Upload syllabus, tentative schedule, trainer HRD accreditation, and trainer CV. These are visible
        on the public course page for visible courses.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {(Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[]).map((kind) => (
          <label key={kind} className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              {PRIVATE_DOC_LABELS[kind]}
            </span>
            <input
              type="file"
              onChange={(e) => onPickFile(kind, e.currentTarget.files?.[0] ?? null)}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 text-sm"
            />
            {privateSelections[kind] && (
              <p className="mt-1 text-xs font-semibold text-black/70">
                Selected: {privateSelections[kind]?.name}
              </p>
            )}
          </label>
        ))}
      </div>

      {editingId && existingPrivatePaths && (
        <div className="mt-3 flex flex-wrap gap-2">
          {(Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[]).map((kind) => {
            const col = columnForKind(kind) as keyof CoursePrivatePaths;
            const path = existingPrivatePaths[col];
            return (
              <button
                key={kind}
                type="button"
                disabled={!path}
                onClick={() => onOpenExisting(path)}
                className="rounded-md border border-[#7A1F1F] bg-white px-2 py-1 text-xs font-semibold text-[#7A1F1F] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {path ? `Open ${PRIVATE_DOC_LABELS[kind]}` : `${PRIVATE_DOC_LABELS[kind]} (none)`}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

