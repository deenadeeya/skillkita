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
  disabled,
  variant = "primary",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const className =
    variant === "danger"
      ? "border-red-300 bg-white text-red-700 hover:border-red-700 hover:bg-red-700 hover:text-white"
      : variant === "secondary"
        ? "border-[#d8c9c2] bg-white text-[#7A1F1F] hover:border-[#8B6914] hover:bg-[#8B6914] hover:text-white"
        : "border-[#0001fc]/30 bg-[#0001fc]/5 text-[#0001fc] hover:border-[#0001fc] hover:bg-[#0001fc] hover:text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0001fc] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
