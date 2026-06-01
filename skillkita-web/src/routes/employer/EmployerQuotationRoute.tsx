import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { employerNavItems } from "../../app/layout/navItems";
import { signOutAndRedirectHome } from "../../shared/auth/signOutAndRedirectHome";
import { useViewer } from "../../shared/hooks/useViewer";
import { listVisibleCourses } from "../../features/courses/api/coursesApi";
import { createEmployerQuotationRequest } from "../../features/quotation/api/quotationRequestsApi";
import { isQuotationCourseMode } from "../../features/quotation/quotationCourseMode";
import {
  QuotationRequestFormFields,
  resolveQuotationTo,
  type QuotationFormValues,
} from "../../features/quotation/components/QuotationRequestFormFields";
import type { QuotationCourseOption } from "../../features/quotation/components/CourseSearchSelect";
import { DashboardPageHeader } from "../../shared/ui/DashboardPageHeader";

const emptyFormValues = (): QuotationFormValues => ({
  toSource: "profile",
  manualCompanyName: "",
  manualCompanyAddress: "",
  courseName: "",
  selectedCourseId: "",
  courseMode: "",
  pricePerPax: "",
  courseLocationAddress: "",
  courseDate: "",
  additionalDescription: "",
});

const EmployerQuotationRequest = () => {
  const viewerState = useViewer();
  const [formValues, setFormValues] = useState<QuotationFormValues>(emptyFormValues);
  const [courseOptions, setCourseOptions] = useState<QuotationCourseOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileCompanyName =
    viewerState.kind === "signedIn" ? viewerState.viewer.companyName?.trim() ?? "" : "";
  const profileCompanyAddress =
    viewerState.kind === "signedIn" ? viewerState.viewer.companyAddress?.trim() ?? "" : "";

  const loadCourseOptions = useCallback(async () => {
    try {
      const rows = await listVisibleCourses();
      setCourseOptions(
        rows.map((c) => ({
          id: c.id,
          name: c.name,
          date: c.date,
          poster_url: c.poster_url,
        }))
      );
    } catch (e) {
      setCourseOptions([]);
      setErrorMessage(e instanceof Error ? e.message : "Failed to load courses.");
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    void loadCourseOptions().finally(() => setIsLoading(false));
  }, [loadCourseOptions]);

  const sortedCourseOptions = [...courseOptions].sort((a, b) => a.name.localeCompare(b.name));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const resolvedTo = resolveQuotationTo(formValues, profileCompanyName, profileCompanyAddress);
    const price = parseFloat(formValues.pricePerPax);

    if (
      !resolvedTo.companyName ||
      !formValues.courseName.trim() ||
      !isQuotationCourseMode(formValues.courseMode) ||
      !Number.isFinite(price) ||
      price < 0 ||
      !formValues.courseLocationAddress.trim() ||
      !formValues.courseDate
    ) {
      setErrorMessage(
        "Please complete To (company name), course name, course mode, price per pax, course location address, and course date."
      );
      return;
    }

    if (viewerState.kind !== "signedIn") {
      setErrorMessage("Not authenticated.");
      return;
    }
    const viewer = viewerState.viewer;
    if (viewer.role !== "employer" || viewer.status === "rejected") {
      setErrorMessage("Employer account not available.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createEmployerQuotationRequest({
        employer_user_id: viewer.userId,
        company_name_snapshot: resolvedTo.companyName,
        company_name: resolvedTo.companyName,
        company_address: resolvedTo.companyAddress ? resolvedTo.companyAddress : null,
        course_name: formValues.courseName.trim(),
        course_mode: formValues.courseMode,
        unit_price: price,
        course_location_address: formValues.courseLocationAddress.trim(),
        number_of_employers: 1,
        proposed_date: formValues.courseDate,
        additional_description: formValues.additionalDescription.trim() || null,
      });
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to submit request.");
      return;
    }

    window.location.href = "/employer";
  };

  return (
    <DashboardLayout
      items={employerNavItems}
      userName={viewerState.kind === "signedIn" ? viewerState.viewer.fullName : "Employer"}
      userEmail={viewerState.kind === "signedIn" ? viewerState.viewer.email : null}
      onLogout={() => {
        void signOutAndRedirectHome();
      }}
    >
      <a
        href="/employer"
        className="inline-flex min-h-[44px] items-center text-sm font-semibold text-primary hover:underline"
      >
        ← Back to employer dashboard
      </a>
      <DashboardPageHeader
        className="mt-4"
        title="Request a quotation"
        subtitle="Submit your quotation details below. An administrator will review your request. When approved, you can download your quotation PDF from the employer dashboard."
      />

      {errorMessage && (
        <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="sk-card mx-auto mt-8 max-w-3xl overflow-hidden p-6 md:p-8">
        <div className="border-b border-black/5 pb-5">
          <h2 className="text-xl font-bold text-primary md:text-2xl">New Quotation Application</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Fill in all required fields. Contact admin through Chat Support for any questions.
          </p>
        </div>

        <div className="mt-6">
          <QuotationRequestFormFields
            values={formValues}
            onChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
            profileCompanyName={profileCompanyName}
            profileCompanyAddress={profileCompanyAddress}
            courseOptions={sortedCourseOptions}
            disabled={isLoading}
            isSubmitting={isSubmitting}
            submitLabel="Submit"
            onSubmit={(ev) => void handleSubmit(ev)}
          />
        </div>
      </section>
    </DashboardLayout>
  );
};

export default EmployerQuotationRequest;
