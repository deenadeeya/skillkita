import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { buildQuotationPdfBlob } from "../../features/quotation/buildQuotationPdf";
import { uploadQuotationPdf } from "../../features/quotation/storage";
import type { QuotationRequestRow } from "../../features/quotation/types";
import { AdminCreateQuotationForm } from "../../features/quotation/components/AdminCreateQuotationForm";
import { supabase } from "../../shared/api/supabaseClient";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";
import { useViewer } from "../../shared/hooks/useViewer";
import {
  adminCreateApprovedQuotationRequest,
  listApprovedEmployers,
  listCourseLabels,
  setQuotationPdfPath,
  type ApprovedEmployerOption,
  type CourseLabel,
} from "../../features/quotation/api/quotationRequestsApi";

const AdminCreateQuotation = () => {
  const [approvedEmployers, setApprovedEmployers] = useState<ApprovedEmployerOption[]>([]);
  const [courses, setCourses] = useState<CourseLabel[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const viewerState = useViewer();

  // Admin-created quotation (auto-approved)
  const [createEmployerUserId, setCreateEmployerUserId] = useState("");
  const [createManualEmployerName, setCreateManualEmployerName] = useState("");
  const [createCompanyName, setCreateCompanyName] = useState("");
  const [createCompanyAddress, setCreateCompanyAddress] = useState("");
  const [createCourseId, setCreateCourseId] = useState("");
  const [createCourseName, setCreateCourseName] = useState("");
  const [createParticipants, setCreateParticipants] = useState("");
  const [createProposedDate, setCreateProposedDate] = useState("");
  const [createAdditionalDescription, setCreateAdditionalDescription] = useState("");
  const [createCourseMode, setCreateCourseMode] = useState("");
  const [createUnitPrice, setCreateUnitPrice] = useState("");
  const [createAmountRm, setCreateAmountRm] = useState("");

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
      const rows = await listCourseLabels();
      setCourses(rows);
    } catch (e) {
      setCourses([]);
      setErrorMessage(e instanceof Error ? e.message : "Failed to load courses.");
    }
  }, []);

  useEffect(() => {
    if (viewerState.kind === "signedIn") {
      setAdminEmail(viewerState.viewer.email);
      setAdminName(viewerState.viewer.fullName || "Admin");
    }
  }, [viewerState]);

  useEffect(() => {
    void loadApprovedEmployers();
    void loadCourses();
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
  const isManualCourse = createCourseId === "__manual__";

  const createCourseOptions = useMemo(() => {
    return courses.map((c) => ({ value: c.id, label: c.name }));
  }, [courses]);

  useEffect(() => {
    if (isManualEmployer) return;
    const match = approvedEmployers.find((e) => e.user_id === createEmployerUserId);
    if (!match) return;
    if (!createCompanyName.trim() && match.company_name?.trim()) {
      setCreateCompanyName(match.company_name);
    }
    if (!createCompanyAddress.trim() && match.company_address?.trim()) {
      setCreateCompanyAddress(match.company_address);
    }
  }, [
    approvedEmployers,
    createCompanyAddress,
    createCompanyName,
    createEmployerUserId,
    isManualEmployer,
  ]);

  useEffect(() => {
    if (isManualCourse) return;
    const match = courses.find((c) => c.id === createCourseId);
    if (!match) return;
    if (match.name.trim() && createCourseName !== match.name) {
      setCreateCourseName(match.name);
    }
  }, [courses, createCourseId, createCourseName, isManualCourse]);

  const handleAdminCreate = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setErrorMessage(null);

    const participants = parseInt(createParticipants, 10);
    const unit = parseFloat(createUnitPrice);
    const amount = parseFloat(createAmountRm);

    const manualEmployerName = createManualEmployerName.trim();
    const hasEmployer =
      (!!createEmployerUserId && !isManualEmployer) || (isManualEmployer && !!manualEmployerName);

    if (
      !hasEmployer ||
      !createCompanyName.trim() ||
      !createCourseName.trim() ||
      !Number.isFinite(participants) ||
      participants < 1 ||
      !createProposedDate ||
      !createCourseMode.trim() ||
      !Number.isFinite(unit) ||
      unit < 0 ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setErrorMessage(
        "Fill employer (or manual employer name), company name, course name, participants (≥1), proposed booking date, mode, unit price (RM), and amount (RM)."
      );
      return;
    }

    setIsSaving(true);
    try {
      const reviewer = viewerState.kind === "signedIn" ? viewerState.viewer.userId : null;
      if (!reviewer) throw new Error("Not authenticated.");

      const targetEmployerUserId = isManualEmployer ? reviewer : createEmployerUserId;
      const snapshot = createCompanyName.trim();
      const employerDisplayName = isManualEmployer
        ? manualEmployerName
        : approvedEmployers.find((e) => e.user_id === createEmployerUserId)?.full_name ?? "Employer";
      const mergedAdditional =
        `Employer: ${employerDisplayName}${
          createAdditionalDescription.trim() ? `\n\n${createAdditionalDescription.trim()}` : ""
        }` || null;

      const payload = {
        employer_user_id: targetEmployerUserId,
        company_name_snapshot: snapshot,
        company_address: createCompanyAddress.trim() ? createCompanyAddress.trim() : null,
        course_name: createCourseName.trim(),
        number_of_employers: participants,
        proposed_date: createProposedDate,
        additional_description: mergedAdditional,
        status: "approved" as const,
        company_name: createCompanyName.trim(),
        course_mode: createCourseMode.trim(),
        unit_price: unit,
        amount_rm: amount,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
        updated_at: new Date().toISOString(),
      };

      const created = (await adminCreateApprovedQuotationRequest(payload)) as QuotationRequestRow;

      const pdfInput = {
        company_name: createCompanyName.trim(),
        course_name: createCourseName.trim(),
        course_mode: createCourseMode.trim(),
        unit_price: unit,
        amount_rm: amount,
        number_of_employers: participants,
        proposed_date: createProposedDate,
        additional_description: mergedAdditional,
      };

      const blob = buildQuotationPdfBlob(pdfInput, {
        quotation_id: created.quotation_no != null ? String(created.quotation_no) : created.id,
        approved_date: new Date().toISOString(),
        employer_company_address: createCompanyAddress.trim() || undefined,
      });
      const path = await uploadQuotationPdf(targetEmployerUserId, created.id, blob);

      await setQuotationPdfPath(created.id, path);

      setCreateEmployerUserId("");
      setCreateManualEmployerName("");
      setCreateCompanyName("");
      setCreateCompanyAddress("");
      setCreateCourseId("");
      setCreateCourseName("");
      setCreateParticipants("");
      setCreateProposedDate("");
      setCreateAdditionalDescription("");
      setCreateCourseMode("");
      setCreateUnitPrice("");
      setCreateAmountRm("");

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
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
      <AdminPageFrame
        title="Create quotation"
        subtitle="Admin-created quotations are automatically approved. Fill all details and a PDF will be generated immediately."
        errorMessage={errorMessage}
        isAuthChecking={false}
        isAuthorized
        actions={
          <a href="/admin/quotations" className="sk-button-secondary px-3 py-2">
            Back to quotation requests
          </a>
        }
      >
        <AdminCreateQuotationForm
          isSaving={isSaving}
          createEmployerUserId={createEmployerUserId}
          createEmployerOptions={createEmployerOptions}
          isManualEmployer={isManualEmployer}
          createManualEmployerName={createManualEmployerName}
          createCompanyName={createCompanyName}
          createCompanyAddress={createCompanyAddress}
          createCourseId={createCourseId}
          createCourseOptions={createCourseOptions}
          isManualCourse={isManualCourse}
          createCourseName={createCourseName}
          createParticipants={createParticipants}
          createProposedDate={createProposedDate}
          createAdditionalDescription={createAdditionalDescription}
          createCourseMode={createCourseMode}
          createUnitPrice={createUnitPrice}
          createAmountRm={createAmountRm}
          onChange={(patch) => {
            if (patch.createEmployerUserId !== undefined) setCreateEmployerUserId(patch.createEmployerUserId);
            if (patch.createManualEmployerName !== undefined) setCreateManualEmployerName(patch.createManualEmployerName);
            if (patch.createCompanyName !== undefined) setCreateCompanyName(patch.createCompanyName);
            if (patch.createCompanyAddress !== undefined) setCreateCompanyAddress(patch.createCompanyAddress);
            if (patch.createCourseId !== undefined) {
              const next = patch.createCourseId;
              setCreateCourseId(next);
              if (next !== "__manual__") {
                const match = courses.find((c) => c.id === next);
                if (match?.name) setCreateCourseName(match.name);
              }
            }
            if (patch.createCourseName !== undefined) setCreateCourseName(patch.createCourseName);
            if (patch.createParticipants !== undefined) setCreateParticipants(patch.createParticipants);
            if (patch.createProposedDate !== undefined) setCreateProposedDate(patch.createProposedDate);
            if (patch.createAdditionalDescription !== undefined) setCreateAdditionalDescription(patch.createAdditionalDescription);
            if (patch.createCourseMode !== undefined) setCreateCourseMode(patch.createCourseMode);
            if (patch.createUnitPrice !== undefined) setCreateUnitPrice(patch.createUnitPrice);
            if (patch.createAmountRm !== undefined) setCreateAmountRm(patch.createAmountRm);
          }}
          onSubmit={(ev) => void handleAdminCreate(ev)}
        />
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminCreateQuotation;

