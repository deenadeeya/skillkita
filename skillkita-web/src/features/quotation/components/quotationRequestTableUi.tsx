import { EyeIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import type { QuotationRequestRow } from "../types";

export function formatQuotationSubmitted(createdAt: string): string {
  return new Date(createdAt).toLocaleString();
}

export function formatQuotationReviewedDate(reviewedAt: string | null): string {
  if (!reviewedAt) return "—";
  const d = new Date(reviewedAt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-CA");
}

export const QUOTATION_REQUESTS_TABLE_MIN_WIDTH = "min-w-[720px]";

export function QuotationRequestsTableHead() {
  return (
    <thead>
      <tr className="bg-primary/5 text-primary">
        <th className="px-4 py-2.5 font-semibold">Course Title</th>
        <th className="px-6 py-2.5 font-semibold">Course Date</th>
        <th className="px-4 py-2.5 font-semibold">Reviewed</th>
        <th className="px-4 py-2.5 font-semibold">Status</th>
        <th className="px-4 py-2.5 font-semibold">Actions</th>
      </tr>
    </thead>
  );
}

export function QuotationCourseCell({ row }: { row: QuotationRequestRow }) {
  return (
    <>
      <p className="font-medium text-ink">{row.course_name}</p>
      {row.quotation_no != null ? (
        <p className="mt-0.5 text-xs text-ink/55">
          Quotation #{String(row.quotation_no).padStart(4, "0")}
        </p>
      ) : null}
      <p className="mt-0.5 text-xs text-ink/55">
        Submitted {formatQuotationSubmitted(row.created_at)}
      </p>
    </>
  );
}

export function QuotationStatusCell({ row }: { row: QuotationRequestRow }) {
  return (
    <>
      <StatusBadge status={row.status} />
      {row.status === "rejected" && row.rejection_reason ? (
        <p className="mt-1.5 max-w-xs text-xs text-red-800">
          <span className="font-semibold">Reason:</span> {row.rejection_reason}
        </p>
      ) : null}
    </>
  );
}

export function QuotationViewIconButton({
  onClick,
  href,
  label = "View details",
  disabled,
}: {
  onClick?: () => void;
  href?: string;
  label?: string;
  disabled?: boolean;
}) {
  const className =
    "inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-ink-muted transition-colors duration-150 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  if (href) {
    return (
      <a href={href} className={className} aria-label={label}>
        <EyeIcon className="h-4 w-4" aria-hidden="true" />
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={label}
    >
      <EyeIcon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export function QuotationDeleteIconButton({
  onClick,
  disabled,
  label = "Delete quotation",
  busy = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-2.5 py-1.5 text-ink-muted transition-colors duration-150 hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={busy ? "Deleting quotation" : label}
    >
      <TrashIcon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export function quotationStatusLabel(status: QuotationRequestRow["status"]): string {
  if (status === "pending") return "Pending review";
  if (status === "approved") return "Approved";
  return "Rejected";
}

export function StatusBadge({ status }: { status: QuotationRequestRow["status"] }) {
  const styles =
    status === "approved"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "pending"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : "bg-red-50 text-red-800 ring-red-200";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles}`}
    >
      {quotationStatusLabel(status)}
    </span>
  );
}

export function QuotationActionButton({
  children,
  onClick,
  href,
  disabled,
  variant = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const className =
    variant === "danger"
      ? "border-red-300 bg-white text-red-700 hover:border-red-700 hover:bg-red-700 hover:text-white"
      : variant === "secondary"
        ? "border-black/10 bg-white text-primary hover:border-secondary hover:bg-secondary hover:text-white"
        : "border-primary/30 bg-primary/5 text-ink hover:border-primary hover:bg-primary-dark hover:text-white";

  const sharedClassName = `inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-semibold no-underline transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`;

  if (href) {
    return (
      <a href={href} className={sharedClassName}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={sharedClassName}
    >
      {children}
    </button>
  );
}
