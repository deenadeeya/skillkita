import type { QuotationRequestRow } from "../types";

type EmployerLabel = {
  full_name: string;
  company_name: string | null;
  company_address: string | null;
};

type Props = {
  rows: QuotationRequestRow[];
  employerLabels: Record<string, EmployerLabel>;
  isLoading: boolean;
  downloadId: string | null;
  deleteId: string | null;
  onReview: (row: QuotationRequestRow) => void;
  onDownload: (row: QuotationRequestRow) => void;
  onDeleteRequest: (row: QuotationRequestRow) => void;
  isSaving?: boolean;
};

function getEmployerDisplayName(
  row: QuotationRequestRow,
  labels: Record<string, EmployerLabel>
) {
  const label = labels[row.employer_user_id];
  const fallbackName = row.company_name_snapshot || row.employer_user_id;
  if (!label) return fallbackName;
  return label.company_name ? `${label.full_name} (${label.company_name})` : label.full_name;
}

export function AdminQuotationRequestsTable({
  rows,
  employerLabels,
  isLoading,
  downloadId,
  deleteId,
  onReview,
  onDownload,
  onDeleteRequest,
  isSaving = false,
}: Props) {
  return (
    <section className="sk-card mt-8 p-6">
      <h2 className="text-xl font-bold text-[#7A1F1F]">All requests</h2>
      {isLoading && <p className="mt-4 text-sm">Loading…</p>}
      {!isLoading && rows.length === 0 && (
        <p className="mt-4 text-sm text-black">No quotation requests yet.</p>
      )}
      {!isLoading && rows.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#efe1db] text-[#7A1F1F]">
                <th className="py-2 pr-3 font-semibold">Employer</th>
                <th className="py-2 pr-3 font-semibold">Course</th>
                <th className="py-2 pr-3 font-semibold">Proposed</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-[#efe1db]">
                  <td className="py-3 pr-3 align-top">{getEmployerDisplayName(r, employerLabels)}</td>
                  <td className="py-3 pr-3 align-top">{r.course_name}</td>
                  <td className="py-3 pr-3 align-top">{r.proposed_date}</td>
                  <td className="py-3 pr-3 align-top capitalize">{r.status}</td>
                  <td className="py-3 align-top">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      {r.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => onReview(r)}
                          className="shrink-0 rounded-sm font-semibold text-[#0001fc] underline decoration-[#0001fc]/40 underline-offset-2 transition hover:text-[#0001cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0001fc] focus-visible:ring-offset-2"
                        >
                          Review
                        </button>
                      )}

                      {r.status === "approved" &&
                        (r.pdf_storage_path ? (
                          <button
                            type="button"
                            onClick={() => onDownload(r)}
                            className="shrink-0 rounded-sm font-semibold text-[#0001fc] underline decoration-[#0001fc]/40 underline-offset-2 transition hover:text-[#0001cc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0001fc] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={downloadId === r.id}
                          >
                            {downloadId === r.id ? "Preparing..." : "Download"}
                          </button>
                        ) : (
                          <span className="shrink-0 text-sm font-medium text-red-700">Missing PDF</span>
                        ))}

                      {r.status === "rejected" && (
                        <span className="shrink-0 text-sm text-black/50" aria-hidden>
                          —
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => onDeleteRequest(r)}
                        className="shrink-0 rounded-sm font-semibold text-red-700 underline decoration-red-700/40 underline-offset-2 transition hover:text-red-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-red-300"
                        disabled={deleteId === r.id || isSaving}
                      >
                        {deleteId === r.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

