import { useMemo, useState } from "react";
import type { QuotationRequestRow } from "../types";
import { canDownloadInvoicePdf } from "../quotationRowToPdf";
import { QuotationActionButton, StatusBadge } from "./quotationRequestTableUi";

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
  invoiceDownloadId: string | null;
  deleteId: string | null;
  onDownloadQuotation: (row: QuotationRequestRow) => void;
  onDownloadInvoice: (row: QuotationRequestRow) => void;
  onDeleteRequest: (row: QuotationRequestRow) => void;
};

type EmployerGroup = {
  employerId: string;
  displayName: string;
  requests: QuotationRequestRow[];
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

function formatReviewedDate(reviewedAt: string | null): string {
  if (!reviewedAt) return "—";
  const d = new Date(reviewedAt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-CA");
}

function groupRowsByEmployer(
  rows: QuotationRequestRow[],
  labels: Record<string, EmployerLabel>
): EmployerGroup[] {
  const byEmployer = new Map<string, QuotationRequestRow[]>();
  for (const row of rows) {
    const list = byEmployer.get(row.employer_user_id) ?? [];
    list.push(row);
    byEmployer.set(row.employer_user_id, list);
  }

  return Array.from(byEmployer.entries())
    .map(([employerId, requests]) => {
      const sorted = [...requests].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return {
        employerId,
        displayName: getEmployerDisplayName(sorted[0]!, labels),
        requests: sorted,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-primary transition-transform duration-200 ${
        expanded ? "rotate-0" : "-rotate-90"
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function QuotationRequestRowCells({
  row,
  busy,
  canDownloadDocs,
  downloadId,
  invoiceDownloadId,
  deleteId,
  onDownloadQuotation,
  onDownloadInvoice,
  onDeleteRequest,
}: {
  row: QuotationRequestRow;
  busy: boolean;
  canDownloadDocs: boolean;
  downloadId: string | null;
  invoiceDownloadId: string | null;
  deleteId: string | null;
  onDownloadQuotation: (row: QuotationRequestRow) => void;
  onDownloadInvoice: (row: QuotationRequestRow) => void;
  onDeleteRequest: (row: QuotationRequestRow) => void;
}) {
  return (
    <tr className="border-t border-black/10 transition hover:bg-primary/5/60">
      <td className="px-4 py-3 align-top text-ink">{row.course_name}</td>
      <td className="px-4 py-3 align-top whitespace-nowrap text-ink-muted">{row.proposed_date}</td>
      <td className="px-4 py-3 align-top whitespace-nowrap text-ink-muted">
        {formatReviewedDate(row.reviewed_at)}
      </td>
      <td className="px-4 py-3 align-top">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex flex-wrap gap-2">
          {row.status === "pending" && (
            <QuotationActionButton href={`/admin/quotations/review/${row.id}`}>
              Review
            </QuotationActionButton>
          )}

          {row.status === "approved" && (
            <>
              {canDownloadDocs ? (
                <QuotationActionButton onClick={() => onDownloadQuotation(row)} disabled={busy}>
                  {downloadId === row.id ? "Preparing…" : "Quotation"}
                </QuotationActionButton>
              ) : null}
              {canDownloadDocs ? (
                <QuotationActionButton
                  variant="secondary"
                  onClick={() => onDownloadInvoice(row)}
                  disabled={busy}
                >
                  {invoiceDownloadId === row.id ? "Preparing…" : "Invoice"}
                </QuotationActionButton>
              ) : (
                <span className="self-center text-xs text-ink-muted">Invoice unavailable</span>
              )}
            </>
          )}

          <QuotationActionButton
            variant="danger"
            onClick={() => onDeleteRequest(row)}
            disabled={busy}
          >
            {deleteId === row.id ? "Deleting…" : "Delete"}
          </QuotationActionButton>
        </div>
      </td>
    </tr>
  );
}

export function AdminQuotationRequestsTable({
  rows,
  employerLabels,
  isLoading,
  downloadId,
  invoiceDownloadId,
  deleteId,
  onDownloadQuotation,
  onDownloadInvoice,
  onDeleteRequest,
}: Props) {
  const pendingCount = rows.filter((r) => r.status === "pending").length;
  const approvedCount = rows.filter((r) => r.status === "approved").length;
  const rejectedCount = rows.filter((r) => r.status === "rejected").length;

  const employerGroups = useMemo(
    () => groupRowsByEmployer(rows, employerLabels),
    [rows, employerLabels]
  );

  const [collapsedEmployerIds, setCollapsedEmployerIds] = useState<Set<string>>(() => new Set());

  const toggleEmployerGroup = (employerId: string) => {
    setCollapsedEmployerIds((prev) => {
      const next = new Set(prev);
      if (next.has(employerId)) next.delete(employerId);
      else next.add(employerId);
      return next;
    });
  };

  return (
    <section className="sk-card mt-8 overflow-hidden p-0">
      <div className="border-b border-black/10 bg-primary/5 px-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-primary">All requests</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {rows.length} request{rows.length === 1 ? "" : "s"}
              {!isLoading && rows.length > 0 && (
                <>
                  {" "}
                  from {employerGroups.length} employer
                  {employerGroups.length === 1 ? "" : "s"} · {pendingCount} pending · {approvedCount}{" "}
                  approved · {rejectedCount} rejected
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading && <p className="text-sm text-ink-muted">Loading quotation requests…</p>}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-ink-muted">No quotation requests yet.</p>
        )}
        {!isLoading && rows.length > 0 && (
          <div className="space-y-6">
            {employerGroups.map((group) => {
              const isExpanded = !collapsedEmployerIds.has(group.employerId);

              return (
                <div
                  key={group.employerId}
                  className="overflow-hidden rounded-xl border border-black/10"
                >
                  <button
                    type="button"
                    onClick={() => toggleEmployerGroup(group.employerId)}
                    aria-expanded={isExpanded}
                    className={`flex w-full items-center gap-3 bg-primary/5 px-4 py-3 text-left transition hover:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 ${
                      isExpanded ? "border-b border-black/10" : ""
                    }`}
                  >
                    <ChevronIcon expanded={isExpanded} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-primary">{group.displayName}</h3>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {group.requests.length} quotation request
                        {group.requests.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                        <thead>
                          <tr className="bg-white text-primary">
                            <th className="px-4 py-2.5 font-semibold">Course</th>
                            <th className="px-4 py-2.5 font-semibold">Proposed</th>
                            <th className="px-4 py-2.5 font-semibold">Reviewed</th>
                            <th className="px-4 py-2.5 font-semibold">Status</th>
                            <th className="px-4 py-2.5 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.requests.map((r) => {
                            const busy =
                              downloadId === r.id ||
                              invoiceDownloadId === r.id ||
                              deleteId === r.id;
                            const canDownloadDocs = canDownloadInvoicePdf(r);

                            return (
                              <QuotationRequestRowCells
                                key={r.id}
                                row={r}
                                busy={busy}
                                canDownloadDocs={canDownloadDocs}
                                downloadId={downloadId}
                                invoiceDownloadId={invoiceDownloadId}
                                deleteId={deleteId}
                                onDownloadQuotation={onDownloadQuotation}
                                onDownloadInvoice={onDownloadInvoice}
                                onDeleteRequest={onDeleteRequest}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
