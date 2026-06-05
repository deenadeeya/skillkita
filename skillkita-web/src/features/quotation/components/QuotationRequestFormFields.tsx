import type { FormEvent, ReactNode } from "react";
import { useMemo } from "react";
import { CoursePosterMedia } from "../../courses/components/CoursePosterMedia";
import { QUOTATION_COURSE_MODES } from "../quotationCourseMode";
import { RequiredMark } from "../../../shared/ui/RequiredMark";
import { CourseSearchSelect, type QuotationCourseOption } from "./CourseSearchSelect";

export type ToSource = "profile" | "manual";

export type QuotationFormValues = {
  toSource: ToSource;
  manualCompanyName: string;
  manualCompanyAddress: string;
  courseName: string;
  selectedCourseId: string;
  courseMode: string;
  pricePerPax: string;
  courseLocationAddress: string;
  courseDate: string;
  additionalDescription: string;
};

type Props = {
  values: QuotationFormValues;
  onChange: (patch: Partial<QuotationFormValues>) => void;
  profileCompanyName: string;
  profileCompanyAddress: string;
  courseOptions: QuotationCourseOption[];
  disabled?: boolean;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (ev: FormEvent<HTMLFormElement>) => void;
  /** Rendered above the To fieldset (e.g. admin employer picker). */
  prefix?: ReactNode;
};

export function QuotationRequestFormFields({
  values,
  onChange,
  profileCompanyName,
  profileCompanyAddress,
  courseOptions,
  disabled = false,
  isSubmitting = false,
  submitLabel = "Submit",
  onSubmit,
  prefix,
}: Props) {
  const canUseProfile = Boolean(profileCompanyName || profileCompanyAddress);

  const selectedCourse = useMemo(
    () => courseOptions.find((c) => c.id === values.selectedCourseId) ?? null,
    [courseOptions, values.selectedCourseId]
  );

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      {prefix}

      <fieldset className="space-y-3 rounded-xl border border-black/10 bg-primary/5 p-4">
        <legend className="px-1 text-sm font-semibold text-primary">
          To
          <RequiredMark />
        </legend>
        <p className="text-xs text-ink-muted">
          Choose company name and address from the employer profile, or enter them manually.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="quotation-to-source"
              checked={values.toSource === "profile"}
              disabled={disabled || !canUseProfile}
              onChange={() => onChange({ toSource: "profile" })}
            />
            Use profile company details
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="quotation-to-source"
              checked={values.toSource === "manual"}
              disabled={disabled}
              onChange={() => onChange({ toSource: "manual" })}
            />
            Enter manually
          </label>
        </div>

        {values.toSource === "profile" ? (
          <div className="rounded-lg border border-black/10 bg-white p-3 text-sm">
            <p>
              <span className="font-semibold text-primary">Company name:</span>{" "}
              {profileCompanyName || "—"}
            </p>
            <p className="mt-2 whitespace-pre-wrap">
              <span className="font-semibold text-primary">Address:</span>{" "}
              {profileCompanyAddress || "—"}
            </p>
            {!canUseProfile && (
              <p className="mt-2 text-xs text-amber-800">
                Add company name or address in the profile, or choose manual entry.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-primary">
                Company name
                <RequiredMark />
              </span>
              <input
                value={values.manualCompanyName}
                onChange={(e) => onChange({ manualCompanyName: e.target.value })}
                disabled={disabled}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
                required={values.toSource === "manual"}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-primary">
                Company address
                <span className="ml-1 font-normal text-ink-muted">(optional)</span>
              </span>
              <textarea
                value={values.manualCompanyAddress}
                onChange={(e) => onChange({ manualCompanyAddress: e.target.value })}
                disabled={disabled}
                rows={3}
                className="w-full resize-y rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Street, city, postcode"
              />
            </label>
          </div>
        )}
      </fieldset>

      <div className="grid gap-4 md:grid-cols-[1fr,min(200px,38%)] md:items-start">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-primary">
            Course name / Tajuk
            <RequiredMark />
          </span>
          <CourseSearchSelect
            selectedCourseId={values.selectedCourseId}
            courseName={values.courseName}
            options={courseOptions}
            disabled={disabled}
            required
            onChange={(patch) => onChange(patch)}
          />
        </label>

        <aside
          className={`rounded-xl border border-black/10 bg-primary/5 p-3 transition-opacity ${
            selectedCourse ? "opacity-100" : "opacity-60"
          }`}
          aria-live="polite"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Course poster
          </p>
          {selectedCourse ? (
            <>
              <CoursePosterMedia
                url={selectedCourse.poster_url}
                alt={`${selectedCourse.name} poster`}
                className="mt-2 aspect-[210/297] w-full rounded-lg object-cover shadow-sm"
                optimizeWidth={400}
              />
              <p className="mt-2 line-clamp-3 text-xs font-medium text-ink-muted">
                {selectedCourse.name}
              </p>
            </>
          ) : (
            <div className="mt-2 flex aspect-[210/297] w-full items-center justify-center rounded-lg border border-dashed border-black/15 bg-white/80 px-3 text-center text-xs text-ink-muted">
              Select a course from the list to preview its poster
            </div>
          )}
        </aside>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-primary">
            Course mode / Mode kursus
            <RequiredMark />
          </span>
          <select
            value={values.courseMode}
            onChange={(e) => onChange({ courseMode: e.target.value })}
            disabled={disabled}
            className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          <span className="mb-1.5 block text-sm font-semibold text-primary">
            Price / pax (RM)
            <RequiredMark />
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            value={values.pricePerPax}
            onChange={(e) => onChange({ pricePerPax: e.target.value })}
            disabled={disabled}
            className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="0.00"
            required
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-primary">
          Address of course location / Alamat tempat kursus
          <RequiredMark />
        </span>
        <textarea
          value={values.courseLocationAddress}
          onChange={(e) => onChange({ courseLocationAddress: e.target.value })}
          disabled={disabled}
          rows={3}
          className="w-full resize-y rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Venue name, full address"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-primary">
          Course date
          <RequiredMark />
        </span>
        <input
          type="date"
          value={values.courseDate}
          onChange={(e) => onChange({ courseDate: e.target.value })}
          disabled={disabled}
          className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20 md:max-w-xs"
          required
        />
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-primary">
          Additional notes
          <span className="ml-1 font-normal text-ink-muted">(optional)</span>
        </span>
        <textarea
          value={values.additionalDescription}
          onChange={(e) => onChange({ additionalDescription: e.target.value })}
          disabled={disabled}
          rows={3}
          className="w-full resize-y rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm shadow-sm focus:border-primary/35 focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="Participants, contact person, special requirements…"
        />
      </label>

      <div className="flex justify-center border-t border-black/5 pt-6">
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="sk-button-primary min-w-[10rem] rounded-xl px-8 py-2.5 text-base shadow-md shadow-primary/15 transition hover:shadow-lg hover:shadow-primary/20 disabled:shadow-none"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function resolveQuotationTo(
  values: QuotationFormValues,
  profileCompanyName: string,
  profileCompanyAddress: string
): { companyName: string; companyAddress: string } {
  if (values.toSource === "profile") {
    return {
      companyName: profileCompanyName,
      companyAddress: profileCompanyAddress,
    };
  }
  return {
    companyName: values.manualCompanyName.trim(),
    companyAddress: values.manualCompanyAddress.trim(),
  };
}
