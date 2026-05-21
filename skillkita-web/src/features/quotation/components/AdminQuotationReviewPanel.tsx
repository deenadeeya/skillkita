import type { QuotationRequestRow } from "../types";
import { QUOTATION_COURSE_MODES } from "../quotationCourseMode";
import { RequiredMark } from "../../../shared/ui/RequiredMark";

type EmployerLabel = {
  full_name: string;
  company_name: string | null;
  company_address: string | null;
};

type Props = {
  activeReview: QuotationRequestRow;
  employerLabels: Record<string, EmployerLabel>;
  companyName: string;
  companyAddress: string;
  courseMode: string;
  unitPrice: string;
  amountRm: string;
  isSaving: boolean;
  onClose: () => void;
  onChangeCompanyName: (next: string) => void;
  onChangeCompanyAddress: (next: string) => void;
  onChangeCourseMode: (next: string) => void;
  onChangeUnitPrice: (next: string) => void;
  onChangeAmountRm: (next: string) => void;
  onApprove: () => void;
  onReject: () => void;
};

export function AdminQuotationReviewPanel({
  activeReview,
  employerLabels,
  companyName,
  companyAddress,
  courseMode,
  unitPrice,
  amountRm,
  isSaving,
  onClose,
  onChangeCompanyName,
  onChangeCompanyAddress,
  onChangeCourseMode,
  onChangeUnitPrice,
  onChangeAmountRm,
  onApprove,
  onReject,
}: Props) {
  const employer = employerLabels[activeReview.employer_user_id];
  return (
    <section className="sk-card mt-8 p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-xl font-bold text-[#7A1F1F]">Review &amp; price</h2>
        <button type="button" onClick={onClose} className="text-sm font-semibold text-[#7A1F1F] underline">
          Close
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-[#efe1db] bg-[#faf7f2] p-4 text-sm">
        <p>
          <span className="font-semibold text-[#7A1F1F]">Employer:</span>{" "}
          {employer?.full_name ?? "—"}
          {employer?.company_name ? ` (${employer.company_name})` : ""}
        </p>
        <p className="mt-1">
          <span className="font-semibold">To (company):</span>{" "}
          {activeReview.company_name?.trim() || activeReview.company_name_snapshot}
        </p>
        {activeReview.company_address?.trim() ? (
          <p className="mt-1 whitespace-pre-wrap">
            <span className="font-semibold">To (address):</span> {activeReview.company_address}
          </p>
        ) : null}
        <p className="mt-1">
          <span className="font-semibold">Course:</span> {activeReview.course_name}
        </p>
        {activeReview.course_mode?.trim() ? (
          <p className="mt-1">
            <span className="font-semibold">Mode:</span> {activeReview.course_mode}
          </p>
        ) : null}
        {activeReview.unit_price != null ? (
          <p className="mt-1">
            <span className="font-semibold">Requested price / pax:</span> RM{" "}
            {Number(activeReview.unit_price).toFixed(2)}
          </p>
        ) : null}
        {activeReview.course_location_address?.trim() ? (
          <p className="mt-1 whitespace-pre-wrap">
            <span className="font-semibold">Course location:</span> {activeReview.course_location_address}
          </p>
        ) : null}
        <p className="mt-1">
          <span className="font-semibold">Course date:</span> {activeReview.proposed_date}
        </p>
        <p className="mt-1">
          <span className="font-semibold">Participants:</span> {activeReview.number_of_employers}
        </p>
        {activeReview.additional_description && (
          <p className="mt-2 text-black/80">{activeReview.additional_description}</p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <p className="text-sm text-black/70 md:col-span-2">
          Required fields are marked with <RequiredMark />.
        </p>
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Company name (on quotation PDF)
            <RequiredMark />
          </span>
          <input
            value={companyName}
            onChange={(e) => onChangeCompanyName(e.target.value)}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Company address (on quotation PDF)
          </span>
          <textarea
            value={companyAddress}
            onChange={(e) => onChangeCompanyAddress(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
            placeholder="Optional"
          />
          {employer?.company_address?.trim() ? (
            <p className="mt-1 text-xs text-black/60">
              Prefilled from employer profile. You can edit it for this quotation.
            </p>
          ) : null}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Course mode
            <RequiredMark />
          </span>
          <select
            value={courseMode}
            onChange={(e) => onChangeCourseMode(e.target.value)}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
            required
          >
            <option value="" disabled>
              Select…
            </option>
            {QUOTATION_COURSE_MODES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Unit price (RM)
            <RequiredMark />
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={unitPrice}
            onChange={(e) => onChangeUnitPrice(e.target.value)}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Amount (RM)
            <RequiredMark />
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={amountRm}
            onChange={(e) => onChangeAmountRm(e.target.value)}
            className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" disabled={isSaving} onClick={onApprove} className="sk-button-primary">
          {isSaving ? "Saving…" : "Approve & generate PDF"}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={onReject}
          className="sk-button-secondary border-red-200 text-red-800 hover:bg-red-50"
        >
          Reject
        </button>
      </div>
    </section>
  );
}

