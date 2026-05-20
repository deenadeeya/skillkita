import type { FormEvent } from "react";
import { RequiredMark } from "../../../shared/ui/RequiredMark";
import { EmployerSearchSelect } from "./EmployerSearchSelect";
import {
  QuotationRequestFormFields,
  type QuotationFormValues,
} from "./QuotationRequestFormFields";

type EmployerOption = {
  value: string;
  label: string;
  company_name: string | null;
  company_address: string | null;
};

type CourseSuggestion = { id: string; name: string };

type Props = {
  isSaving: boolean;
  isLoading?: boolean;
  createEmployerUserId: string;
  createEmployerOptions: EmployerOption[];
  isManualEmployer: boolean;
  createManualEmployerName: string;
  profileCompanyName: string;
  profileCompanyAddress: string;
  formValues: QuotationFormValues;
  courseNameSuggestions: CourseSuggestion[];
  onEmployerChange: (employerUserId: string) => void;
  onManualEmployerNameChange: (name: string) => void;
  onFormChange: (patch: Partial<QuotationFormValues>) => void;
  onSubmit: (ev: FormEvent<HTMLFormElement>) => void;
};

export function AdminCreateQuotationForm({
  isSaving,
  isLoading = false,
  createEmployerUserId,
  createEmployerOptions,
  isManualEmployer,
  createManualEmployerName,
  profileCompanyName,
  profileCompanyAddress,
  formValues,
  courseNameSuggestions,
  onEmployerChange,
  onManualEmployerNameChange,
  onFormChange,
  onSubmit,
}: Props) {
  const employerPrefix = (
    <div className="space-y-4 rounded-xl border border-[#efe1db] bg-[#faf7f2] p-4">
      <p className="text-sm font-semibold text-[#7A1F1F]">
        Employer
        <RequiredMark />
      </p>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-[#7A1F1F]">Search employer</span>
        <EmployerSearchSelect
          value={createEmployerUserId}
          options={createEmployerOptions}
          onChange={onEmployerChange}
          disabled={isSaving || isLoading}
          required
        />
      </label>

      {isManualEmployer && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-[#7A1F1F]">
            Employer name
            <RequiredMark />
          </span>
          <input
            value={createManualEmployerName}
            onChange={(e) => onManualEmployerNameChange(e.target.value)}
            disabled={isSaving || isLoading}
            className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-[#7A1F1F]/35 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
            placeholder="Type employer name"
            required
          />
          <p className="mt-1 text-xs text-black/60">
            Manual quotations are stored under the admin account; employers will not see them unless
            they have an account.
          </p>
        </label>
      )}
    </div>
  );

  return (
    <section className="sk-card mx-auto max-w-2xl overflow-hidden p-6 md:p-8">
      <div className="border-b border-black/5 pb-5">
        <h2 className="text-xl font-bold text-[#7A1F1F] md:text-2xl">New Quotation Application</h2>
        <p className="mt-2 text-sm leading-relaxed text-black/70">
          Same fields as the employer quotation form. The quotation is created as approved and a PDF
          is generated immediately.
        </p>
      </div>

      <div className="mt-6">
        <QuotationRequestFormFields
          values={formValues}
          onChange={onFormChange}
          profileCompanyName={profileCompanyName}
          profileCompanyAddress={profileCompanyAddress}
          courseNameSuggestions={courseNameSuggestions}
          disabled={isLoading || !createEmployerUserId}
          isSubmitting={isSaving}
          submitLabel="Create & generate PDF"
          onSubmit={onSubmit}
          prefix={employerPrefix}
          datalistId="admin-quotation-course-name-options"
        />
      </div>
    </section>
  );
}
