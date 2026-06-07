import type { QuotationRequestRow } from "../types";
import { canDownloadInvoicePdf } from "../quotationRowToPdf";
import { QuotationActionButton, StatusBadge } from "./quotationRequestTableUi";

type Props = {
  rows: QuotationRequestRow[];
  isLoading: boolean;
  downloadId: string | null;
  invoiceDownloadId: string | null;
  onDownloadQuotation: (row: QuotationRequestRow) => void;
  onDownloadInvoice: (row: QuotationRequestRow) => void;
  requestHref?: string;
};

function formatSubmitted(createdAt: string): string {
  return new Date(createdAt).toLocaleString();
}

export function EmployerQuotationRequestsTable({
  rows,
  isLoading,
  downloadId,
  invoiceDownloadId,
  onDownloadQuotation,
  onDownloadInvoice,
  requestHref = "/employer/quotation",
}: Props) {
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const approvedCount = rows.filter((r) => r.status === "approved").length;
  const rejectedCount = rows.filter((r) => r.status === "rejected").length;

  return (
    <section className="sk-card mt-6 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 bg-primary/5 px-6 py-4">
        <p className="text-sm text-ink-muted">
          {rows.length} request{rows.length === 1 ? "" : "s"}
          {!isLoading && rows.length > 0 && (
            <>
              {" "}
              · {pendingCount} pending · {approvedCount} approved · {rejectedCount} rejected
            </>
          )}
        </p>
        <a href={requestHref} className="sk-button-primary shrink-0 px-4 py-2 text-sm no-underline">
          Request a Quotation
        </a>
      </div>

      <div className="p-6">
        {isLoading && <p className="text-sm text-ink-muted">Loading quotation history…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-ink-muted">No quotation requests yet.</p>
        )}
        {!isLoading && rows.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-black/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-primary/5 text-primary">
                    <th className="px-4 py-2.5 font-semibold">Course</th>
                    <th className="px-4 py-2.5 font-semibold">Proposed</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const busy = downloadId === row.id || invoiceDownloadId === row.id;
                    const canDownloadQuotation = canDownloadInvoicePdf(row);
                    const canDownloadInvoice = canDownloadInvoicePdf(row);

                    return (
                      <tr
                        key={row.id}
                        className="border-t border-black/10 bg-white transition hover:bg-primary/5/60"
                      >
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium text-ink">{row.course_name}</p>
                          {row.quotation_no != null ? (
                            <p className="mt-0.5 text-xs text-ink/55">
                              Quotation #{String(row.quotation_no).padStart(4, "0")}
                            </p>
                          ) : null}
                          <p className="mt-0.5 text-xs text-ink/55">
                            Submitted {formatSubmitted(row.created_at)}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top whitespace-nowrap text-ink-muted">
                          {row.proposed_date}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            {canDownloadQuotation ? (
                              <QuotationActionButton
                                onClick={() => onDownloadQuotation(row)}
                                disabled={busy}
                              >
                                {downloadId === row.id ? "Preparing…" : "Quotation"}
                              </QuotationActionButton>
                            ) : row.status === "approved" ? (
                              <span className="self-center text-xs font-medium text-amber-800">
                                Quotation PDF not ready yet
                              </span>
                            ) : row.status === "pending" ? (
                              <span className="self-center text-xs text-ink-muted">Awaiting review</span>
                            ) : (
                              <span className="self-center text-xs text-ink-muted">—</span>
                            )}

                            {canDownloadInvoice ? (
                              <QuotationActionButton
                                variant="secondary"
                                onClick={() => onDownloadInvoice(row)}
                                disabled={busy}
                              >
                                {invoiceDownloadId === row.id ? "Preparing…" : "Invoice"}
                              </QuotationActionButton>
                            ) : row.status === "approved" && !canDownloadQuotation ? (
                              <span className="self-center text-xs text-ink-muted">Invoice unavailable</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
