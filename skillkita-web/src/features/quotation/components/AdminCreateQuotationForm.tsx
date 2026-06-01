import type { FormEvent } from "react";
import { RequiredMark } from "../../../shared/ui/RequiredMark";
import { EmployerSearchSelect } from "./EmployerSearchSelect";
import {
  QuotationRequestFormFields,
  type QuotationFormValues,
} from "./QuotationRequestFormFields";
import type { QuotationCourseOption } from "./CourseSearchSelect";

type EmployerOption = {
  value: string;
  label: string;
  company_name: string | null;
  company_address: string | null;
};

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
  courseOptions: QuotationCourseOption[];
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
  courseOptions,
  onEmployerChange,
  onManualEmployerNameChange,
  onFormChange,
  onSubmit,
}: Props) {
  const employerReady =
    Boolean(createEmployerUserId) &&
    (!isManualEmployer || Boolean(createManualEmployerName.trim()));

  const employerPrefix = (
    <div className="space-y-4 rounded-xl border border-black/10 bg-primary/5 p-4">
      <div>
        <p className="text-sm font-semibold text-primary">
          Employer
          <RequiredMark />
        </p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
          <span className="font-semibold text-primary">Start here:</span> search and select an
          employer first. If you choose Manual / not listed, enter the employer name below before
          filling in course details and other fields.
        </p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-primary">Search employer</span>
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
          <span className="mb-1.5 block text-sm font-semibold text-primary">
            Employer name
            <RequiredMark />
          </span>
          <input
            value={createManualEmployerName}
            onChange={(e) => onManualEmployerNameChange(e.target.value)}
            disabled={isSaving || isLoading}
            className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Type employer name"
            required
          />
          <p className="mt-1 text-xs text-ink-muted">
            Manual quotations are stored under the admin account; employers will not see them unless
            they have an account.
          </p>
        </label>
      )}
    </div>
  );

  return (
    <section className="sk-card mx-auto max-w-3xl overflow-hidden p-6 md:p-8">
      <div className="border-b border-black/5 pb-5">
        <h2 className="text-xl font-bold text-primary md:text-2xl">New Quotation Application</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Same fields as the employer quotation form. The quotation is created as approved and a PDF
          is generated immediately.
        </p>
        {!employerReady && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Select an employer above first — the rest of the form unlocks after that.
            {isManualEmployer && createEmployerUserId
              ? " For manual entry, also type the employer name."
              : null}
          </p>
        )}
      </div>

      <div className="mt-6">
        <QuotationRequestFormFields
          values={formValues}
          onChange={onFormChange}
          profileCompanyName={profileCompanyName}
          profileCompanyAddress={profileCompanyAddress}
          courseOptions={courseOptions}
          disabled={isLoading || !employerReady}
          isSubmitting={isSaving}
          submitLabel="Create & generate PDF"
          onSubmit={onSubmit}
          prefix={employerPrefix}
        />
      </div>
    </section>
  );
}
