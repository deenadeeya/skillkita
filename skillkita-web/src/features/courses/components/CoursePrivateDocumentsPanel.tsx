import {
  PRIVATE_DOC_LABELS,
  columnForKind,
  type PrivateDocKind,
} from "../../../lib/coursePrivateStorage";
import type { CoursePrivatePaths } from "../api/privateFilesApi";

type Props = {
  viewerRole: "admin" | "employer";
  accessStatus: "pending" | "approved" | "rejected" | null;
  privateFiles: CoursePrivatePaths | null;
  actionBusy: boolean;
  onRequestAccess: () => void;
  onOpenPrivateDoc: (path: string | null | undefined) => void;
};

export function CoursePrivateDocumentsPanel({
  viewerRole,
  accessStatus,
  privateFiles,
  actionBusy,
  onRequestAccess,
  onOpenPrivateDoc,
}: Props) {
  return (
    <section className="sk-card mt-6 p-6">
      <h2 className="text-xl font-bold text-[#7A1F1F]">Private documents</h2>

      {viewerRole === "admin" && (
        <p className="mt-2 text-sm text-black/80">
          As admin, you can open all uploaded private documents for this course.
        </p>
      )}

      {viewerRole === "employer" && (
        <p className="mt-2 text-sm text-black/80">
          Private documents require admin approval. Request access first, then you can open them here.
        </p>
      )}

      {viewerRole === "employer" && !accessStatus && (
        <div className="mt-4">
          <button
            type="button"
            className="sk-button-primary"
            disabled={actionBusy}
            onClick={onRequestAccess}
          >
            {actionBusy ? "Sending..." : "Request access"}
          </button>
        </div>
      )}

      {viewerRole === "employer" && accessStatus === "pending" && (
        <p className="mt-4 text-sm font-semibold text-amber-800">Pending admin approval.</p>
      )}

      {viewerRole === "employer" && accessStatus === "rejected" && (
        <p className="mt-4 text-sm font-semibold text-red-800">
          Your request was rejected. Contact admin for more info.
        </p>
      )}

      {(viewerRole === "admin" || accessStatus === "approved") && (
        <div className="mt-4 flex flex-wrap gap-2">
          {(Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[]).map((kind) => {
            const col = columnForKind(kind) as keyof CoursePrivatePaths;
            const path = privateFiles?.[col];
            return (
              <button
                key={kind}
                type="button"
                disabled={!path}
                onClick={() => onOpenPrivateDoc(path)}
                className="rounded-md border border-[#7A1F1F] bg-[#f9f5ed] px-3 py-1.5 text-xs font-semibold text-[#7A1F1F] disabled:cursor-not-allowed disabled:opacity-50"
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

