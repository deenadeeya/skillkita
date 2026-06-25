import { useEffect } from "react";
import type { QuotationRequestRow } from "../types";
import { StatusBadge } from "./quotationRequestTableUi";

type Props = {
  row: QuotationRequestRow;
  onClose: () => void;
};

function formatSubmitted(createdAt: string): string {
  return new Date(createdAt).toLocaleString();
}

function companyName(row: QuotationRequestRow): string {
  return row.company_name_snapshot?.trim() || row.company_name?.trim() || "—";
}

export function EmployerQuotationDetailPanel({ row, onClose }: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <section
        className="sk-card max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto p-6"
        role="dialog"
        aria-labelledby="employer-quotation-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="employer-quotation-detail-title" className="text-xl font-bold text-primary">
              Quotation details
            </h2>
            <p className="mt-1 text-sm text-ink-muted">{row.course_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-primary underline"
          >
            Close
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={row.status} />
          {row.quotation_no != null ? (
            <span className="text-xs font-medium text-ink/55">
              Quotation #{String(row.quotation_no).padStart(4, "0")}
            </span>
          ) : null}
          <span className="text-xs text-ink/55">Submitted {formatSubmitted(row.created_at)}</span>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-primary">Company name</dt>
            <dd className="mt-0.5 text-ink">{companyName(row)}</dd>
          </div>

          {row.company_address?.trim() ? (
            <div>
              <dt className="font-semibold text-primary">Company address</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ink">{row.company_address}</dd>
            </div>
          ) : null}

          <div>
            <dt className="font-semibold text-primary">Course</dt>
            <dd className="mt-0.5 text-ink">{row.course_name}</dd>
          </div>

          {row.course_mode?.trim() ? (
            <div>
              <dt className="font-semibold text-primary">Course mode</dt>
              <dd className="mt-0.5 text-ink">{row.course_mode}</dd>
            </div>
          ) : null}

          {row.course_location_address?.trim() ? (
            <div>
              <dt className="font-semibold text-primary">Course location</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ink">{row.course_location_address}</dd>
            </div>
          ) : null}

          <div>
            <dt className="font-semibold text-primary">Course date</dt>
            <dd className="mt-0.5 text-ink">{row.proposed_date}</dd>
          </div>

          <div>
            <dt className="font-semibold text-primary">Number of participants</dt>
            <dd className="mt-0.5 text-ink">{row.number_of_employers}</dd>
          </div>

          {row.additional_description?.trim() ? (
            <div>
              <dt className="font-semibold text-primary">Additional notes</dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-ink-muted">{row.additional_description}</dd>
            </div>
          ) : null}

          {row.unit_price != null ? (
            <div>
              <dt className="font-semibold text-primary">Unit price (RM per participant)</dt>
              <dd className="mt-0.5 text-ink">RM {Number(row.unit_price).toFixed(2)}</dd>
            </div>
          ) : null}

          {row.amount_rm != null ? (
            <div>
              <dt className="font-semibold text-primary">Total amount (RM)</dt>
              <dd className="mt-0.5 text-ink">RM {Number(row.amount_rm).toFixed(2)}</dd>
            </div>
          ) : null}
        </dl>
      </section>
    </div>
  );
}
