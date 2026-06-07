import type { ReactNode } from "react";
import type { QuotationRequestRow } from "../types";

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
