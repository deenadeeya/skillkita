import {
  PRIVATE_DOC_LABELS,
  columnForKind,
  type PrivateDocKind,
} from "../../../lib/coursePrivateStorage";
import type { CoursePrivatePaths } from "../api/privateFilesApi";

type CourseSummary = {
  id: string;
  name: string;
  date: string;
};

type Props = {
  isLoading: boolean;
  courses: CourseSummary[];
  accessByCourse: Record<string, "pending" | "approved" | "rejected" | undefined>;
  privateByCourse: Record<string, CoursePrivatePaths | null>;
  actionId: string | null;
  onRequestAccess: (courseId: string) => void;
  onOpenPrivateDoc: (path: string | null | undefined) => void;
};

export function EmployerPrivateAccessPanel({
  isLoading,
  courses,
  accessByCourse,
  privateByCourse,
  actionId,
  onRequestAccess,
  onOpenPrivateDoc,
}: Props) {
  return (
    <section className="sk-card mt-8 p-6">
      <h2 className="text-xl font-bold text-[#7A1F1F]">Courses (private files access)</h2>
      <p className="mt-2 text-sm text-black/80">
        Request access to private course documents (tentativesyllabus, trainer files). An admin must approve
        before you can open them.
      </p>

      {isLoading && <p className="mt-4 text-sm text-black">Loading...</p>}

      {!isLoading && (
        <ul className="mt-4 space-y-4">
          {courses.map((c) => {
            const status = accessByCourse[c.id];
            const priv = privateByCourse[c.id];
            return (
              <li
                key={c.id}
                className="rounded-xl border border-[#efe1db] bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[#0001fc]">{c.name}</h3>
                    <p className="mt-1 text-xs text-black/70">
                      Status:{" "}
                      <span
                        className={
                          status === "approved"
                            ? "font-bold text-green-800"
                            : status === "rejected"
                              ? "font-bold text-red-800"
                              : "font-semibold text-black/80"
                        }
                      >
                        {status === "approved"
                          ? "Approved — you can open private files below"
                          : status === "pending"
                            ? "Pending admin approval"
                            : status === "rejected"
                              ? "Rejected"
                              : "No request yet"}
                      </span>
                    </p>
                  </div>

                  {!status && (
                    <button
                      type="button"
                      disabled={actionId === c.id}
                      onClick={() => onRequestAccess(c.id)}
                      className="sk-button-primary shrink-0 self-start"
                    >
                      {actionId === c.id ? "Sending..." : "Request access to private files"}
                    </button>
                  )}

                  {status === "pending" && (
                    <span className="text-sm font-semibold text-amber-800">Waiting for admin</span>
                  )}
                </div>

                {status === "approved" && priv && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-[#efe1db] pt-4">
                    {(Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[]).map((kind) => {
                      const col = columnForKind(kind) as keyof CoursePrivatePaths;
                      const path = priv[col];
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
              </li>
            );
          })}
        </ul>
      )}

      {!isLoading && courses.length === 0 && (
        <p className="mt-4 text-sm text-black">No public courses listed yet.</p>
      )}
    </section>
  );
}

