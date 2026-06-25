import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { listVisibleCourses } from "../../features/courses/api/coursesApi";
import { parseCoursePriceRm } from "../../features/courses/parseCoursePrice";
import { buildQuotationPdfBlob } from "../../features/quotation/buildQuotationPdf";
import { lookupCourseUnitPriceByName } from "../../features/quotation/coursePriceLookup";
import { uploadQuotationPdf } from "../../features/quotation/storage";
import type { QuotationRequestRow } from "../../features/quotation/types";
import { AdminCreateQuotationForm } from "../../features/quotation/components/AdminCreateQuotationForm";
import type { QuotationCourseOption } from "../../features/quotation/components/CourseSearchSelect";
import {
  resolveQuotationTo,
  type QuotationFormValues,
} from "../../features/quotation/components/QuotationRequestFormFields";
import { isQuotationCourseMode } from "../../features/quotation/quotationCourseMode";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";
import { useViewer } from "../../shared/hooks/useViewer";
import {
  adminCreateApprovedQuotationRequest,
  listApprovedEmployers,
  setQuotationPdfPath,
  type ApprovedEmployerOption,
} from "../../features/quotation/api/quotationRequestsApi";

const emptyFormValues = (): QuotationFormValues => ({
  toSource: "profile",
  manualCompanyName: "",
  manualCompanyAddress: "",
  courseName: "",
  selectedCourseId: "",
  courseMode: "",
  numberOfParticipants: "",
  courseLocationAddress: "",
  courseDate: "",
  additionalDescription: "",
});

const AdminCreateQuotation = () => {
  const [approvedEmployers, setApprovedEmployers] = useState<ApprovedEmployerOption[]>([]);
  const [courseOptions, setCourseOptions] = useState<QuotationCourseOption[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const viewerState = useViewer();

  const [createEmployerUserId, setCreateEmployerUserId] = useState("");
  const [createManualEmployerName, setCreateManualEmployerName] = useState("");
  const [formValues, setFormValues] = useState<QuotationFormValues>(emptyFormValues);

  const loadApprovedEmployers = useCallback(async () => {
    try {
      const rows = await listApprovedEmployers();
      setApprovedEmployers(rows);
    } catch (e) {
      setApprovedEmployers([]);
      setErrorMessage(e instanceof Error ? e.message : "Failed to load employers.");
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const rows = await listVisibleCourses();
      setCourseOptions(
        rows.map((c) => ({
          id: c.id,
          name: c.name,
          date: c.date,
          poster_url: c.poster_url,
          price: c.price,
        }))
      );
    } catch (e) {
      setCourseOptions([]);
      setErrorMessage(e instanceof Error ? e.message : "Failed to load courses.");
    }
  }, []);

  useEffect(() => {
    if (viewerState.kind === "signedIn") {
      setAdminEmail(viewerState.viewer.email);
      setAdminName(viewerState.viewer.displayName || "Admin");
    }
  }, [viewerState]);

  useEffect(() => {
    setIsLoading(true);
    void Promise.all([loadApprovedEmployers(), loadCourses()]).finally(() => setIsLoading(false));
  }, [loadApprovedEmployers, loadCourses]);

  const createEmployerOptions = useMemo(() => {
    return approvedEmployers.map((e) => ({
      value: e.user_id,
      label: `${e.full_name}${e.company_name ? ` (${e.company_name})` : ""}`,
      company_name: e.company_name,
      company_address: e.company_address,
    }));
  }, [approvedEmployers]);

  const isManualEmployer = createEmployerUserId === "__manual__";

  const selectedEmployer = useMemo(
    () => approvedEmployers.find((e) => e.user_id === createEmployerUserId) ?? null,
    [approvedEmployers, createEmployerUserId]
  );

  const profileCompanyName = isManualEmployer
    ? ""
    : (selectedEmployer?.company_name?.trim() ?? "");
  const profileCompanyAddress = isManualEmployer
    ? ""
    : (selectedEmployer?.company_address?.trim() ?? "");

  const sortedCourseOptions = useMemo(() => {
    return [...courseOptions].sort((a, b) => a.name.localeCompare(b.name));
  }, [courseOptions]);

  const handleEmployerChange = (employerUserId: string) => {
    setCreateEmployerUserId(employerUserId);
    const manual = employerUserId === "__manual__";
    const match = approvedEmployers.find((e) => e.user_id === employerUserId);
    const hasProfile = Boolean(match?.company_name?.trim() || match?.company_address?.trim());

    setFormValues((prev) => ({
      ...prev,
      toSource: manual || !hasProfile ? "manual" : "profile",
      manualCompanyName: manual ? prev.manualCompanyName : (match?.company_name?.trim() ?? ""),
      manualCompanyAddress: manual ? prev.manualCompanyAddress : (match?.company_address?.trim() ?? ""),
    }));
  };

  const handleAdminCreate = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setErrorMessage(null);

    const resolvedTo = resolveQuotationTo(formValues, profileCompanyName, profileCompanyAddress);
    const participants = parseInt(formValues.numberOfParticipants, 10);

    const selectedCourse =
      courseOptions.find((c) => c.id === formValues.selectedCourseId) ?? null;
    let unit = selectedCourse ? parseCoursePriceRm(selectedCourse.price) : null;
    if (unit == null && formValues.courseName.trim()) {
      unit = await lookupCourseUnitPriceByName(formValues.courseName.trim());
    }

    const manualEmployerName = createManualEmployerName.trim();
    const hasEmployer =
      (!!createEmployerUserId && !isManualEmployer) || (isManualEmployer && !!manualEmployerName);

    if (
      !hasEmployer ||
      !resolvedTo.companyName ||
      !formValues.courseName.trim() ||
      !isQuotationCourseMode(formValues.courseMode) ||
      !Number.isFinite(participants) ||
      participants < 1 ||
      unit == null ||
      !formValues.courseLocationAddress.trim() ||
      !formValues.courseDate
    ) {
      setErrorMessage(
        "Fill employer (or manual employer name), To (company name), course name, course mode, number of participants, course location address, and course date. The course must have a catalog price (Manage Course)."
      );
      return;
    }

    const amount = unit * participants;

    setIsSaving(true);
    try {
      const reviewer = viewerState.kind === "signedIn" ? viewerState.viewer.userId : null;
      if (!reviewer) throw new Error("Not authenticated.");

      const targetEmployerUserId = isManualEmployer ? reviewer : createEmployerUserId;
      const employerDisplayName = isManualEmployer
        ? manualEmployerName
        : (selectedEmployer?.full_name ?? "Employer");
      const mergedAdditional =
        `Employer: ${employerDisplayName}${
          formValues.additionalDescription.trim() ? `\n\n${formValues.additionalDescription.trim()}` : ""
        }` || null;

      const payload = {
        employer_user_id: targetEmployerUserId,
        company_name_snapshot: resolvedTo.companyName,
        company_address: resolvedTo.companyAddress ? resolvedTo.companyAddress : null,
        course_name: formValues.courseName.trim(),
        number_of_employers: participants,
        proposed_date: formValues.courseDate,
        additional_description: mergedAdditional,
        status: "approved" as const,
        company_name: resolvedTo.companyName,
        course_mode: formValues.courseMode,
        course_location_address: formValues.courseLocationAddress.trim(),
        unit_price: unit,
        amount_rm: amount,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
        updated_at: new Date().toISOString(),
      };

      const created = (await adminCreateApprovedQuotationRequest(payload)) as QuotationRequestRow;

      const pdfInput = {
        company_name: resolvedTo.companyName,
        course_name: formValues.courseName.trim(),
        course_mode: formValues.courseMode,
        unit_price: unit,
        amount_rm: amount,
        number_of_employers: participants,
        proposed_date: formValues.courseDate,
        additional_description: mergedAdditional,
        course_location_address: formValues.courseLocationAddress.trim(),
      };

      const blob = await buildQuotationPdfBlob(pdfInput, {
        quotation_id: created.quotation_no != null ? String(created.quotation_no) : created.id,
        approved_date: new Date().toISOString(),
        employer_company_address: resolvedTo.companyAddress || undefined,
      });
      const path = await uploadQuotationPdf(targetEmployerUserId, created.id, blob);

      await setQuotationPdfPath(created.id, path);

      setCreateEmployerUserId("");
      setCreateManualEmployerName("");
      setFormValues(emptyFormValues());

      window.location.href = "/admin/quotations";
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Create quotation failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      items={adminNavItems}
      userName={adminName}
      userEmail={adminEmail}
>
      <AdminPageFrame
        title="Create Quotation"
        headerVariant="hero"
        subtitle="Use the same quotation application form as employers. The quotation is created as approved and a PDF is generated immediately."
        errorMessage={errorMessage}
        isAuthChecking={false}
        isAuthorized
        actions={
          <a
            href="/admin/quotations"
            className="inline-flex items-center rounded-xl border border-white/50 bg-white/10 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-white/20"
          >
            Back to quotation requests
          </a>
        }
      >
        <AdminCreateQuotationForm
          isSaving={isSaving}
          isLoading={isLoading}
          createEmployerUserId={createEmployerUserId}
          createEmployerOptions={createEmployerOptions}
          isManualEmployer={isManualEmployer}
          createManualEmployerName={createManualEmployerName}
          profileCompanyName={profileCompanyName}
          profileCompanyAddress={profileCompanyAddress}
          formValues={formValues}
          courseOptions={sortedCourseOptions}
          onEmployerChange={handleEmployerChange}
          onManualEmployerNameChange={setCreateManualEmployerName}
          onFormChange={(patch) => setFormValues((prev) => ({ ...prev, ...patch }))}
          onSubmit={(ev) => void handleAdminCreate(ev)}
        />
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminCreateQuotation;
