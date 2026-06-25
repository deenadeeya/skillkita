import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { buildQuotationPdfBlob } from "../../features/quotation/buildQuotationPdf";
import { quotationTotalAmountRm } from "../../features/quotation/quotationRowToPdf";
import { uploadQuotationPdf } from "../../features/quotation/storage";
import { lookupCourseUnitPriceByName } from "../../features/quotation/coursePriceLookup";
import type { QuotationRequestRow } from "../../features/quotation/types";
import { AdminQuotationReviewPanel } from "../../features/quotation/components/AdminQuotationReviewPanel";
import {
  getQuotationRequestById,
  listEmployerLabels,
  updateQuotationRequest,
} from "../../features/quotation/api/quotationRequestsApi";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";
import { useViewer } from "../../shared/hooks/useViewer";

type EmployerLabel = {
  full_name: string;
  company_name: string | null;
  company_address: string | null;
};

const AdminQuotationReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const viewerState = useViewer();

  const [request, setRequest] = useState<QuotationRequestRow | null>(null);
  const [employerLabel, setEmployerLabel] = useState<EmployerLabel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [courseMode, setCourseMode] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [amountRm, setAmountRm] = useState("");

  const load = useCallback(async () => {
    if (!id) {
      setRequest(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const row = await getQuotationRequestById(id);
      setRequest(row);

      if (row) {
        const labels = await listEmployerLabels([row.employer_user_id]);
        setEmployerLabel(labels[row.employer_user_id] ?? null);
      } else {
        setEmployerLabel(null);
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to load quotation request.");
      setRequest(null);
      setEmployerLabel(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (viewerState.kind === "signedIn") {
      setAdminEmail(viewerState.viewer.email);
      setAdminName(viewerState.viewer.displayName || "Admin");
    }
  }, [viewerState]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!request) return;

    setCompanyName(request.company_name_snapshot?.trim() || request.company_name?.trim() || "");
    setCompanyAddress(
      request.company_address?.trim() || employerLabel?.company_address?.trim() || ""
    );
    setCourseMode(request.course_mode ?? "");

    void (async () => {
      let catalogUnit: number | null = null;
      try {
        catalogUnit = await lookupCourseUnitPriceByName(request.course_name);
      } catch {
        catalogUnit = null;
      }

      const unit =
        catalogUnit ?? (request.unit_price != null ? Number(request.unit_price) : null);

      setUnitPrice(unit != null ? String(unit) : "");

      if (unit != null) {
        setAmountRm(String(quotationTotalAmountRm(unit, request.number_of_employers)));
      } else {
        setAmountRm(request.amount_rm != null ? String(request.amount_rm) : "");
      }
    })();
  }, [request, employerLabel]);

  useEffect(() => {
    if (!request) return;
    const unit = parseFloat(unitPrice);
    if (!Number.isFinite(unit) || unit < 0) return;
    setAmountRm(String(quotationTotalAmountRm(unit, request.number_of_employers)));
  }, [unitPrice, request]);

  const goBack = () => {
    navigate("/admin/quotations");
  };

  const handleReject = async (rejectionReason: string) => {
    if (!request) return;

    setIsSaving(true);
    setErrorMessage(null);
    const reviewer = viewerState.kind === "signedIn" ? viewerState.viewer.userId : null;

    try {
      await updateQuotationRequest(request.id, {
        status: "rejected",
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
        updated_at: new Date().toISOString(),
      });
      goBack();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Reject failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!request) return;

    const unit = parseFloat(unitPrice);
    const amount = quotationTotalAmountRm(unit, request.number_of_employers);
    if (
      !companyName.trim() ||
      !courseMode.trim() ||
      !Number.isFinite(unit) ||
      unit < 0 ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setErrorMessage("Fill company name, course mode, unit price (RM), and amount (RM) with valid numbers.");
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const pdfInput = {
        company_name: companyName.trim(),
        course_name: request.course_name,
        course_mode: courseMode.trim(),
        unit_price: unit,
        amount_rm: amount,
        number_of_employers: request.number_of_employers,
        proposed_date: request.proposed_date,
        additional_description: request.additional_description,
        course_location_address: request.course_location_address,
      };

      const blob = await buildQuotationPdfBlob(pdfInput, {
        quotation_id: request.quotation_no != null ? String(request.quotation_no) : request.id,
        approved_date: new Date().toISOString(),
        employer_company_address: companyAddress.trim() || undefined,
      });
      const path = await uploadQuotationPdf(request.employer_user_id, request.id, blob);

      const reviewer = viewerState.kind === "signedIn" ? viewerState.viewer.userId : null;
      await updateQuotationRequest(request.id, {
        status: "approved",
        company_name: companyName.trim(),
        company_address: companyAddress.trim() ? companyAddress.trim() : null,
        course_mode: courseMode.trim(),
        unit_price: unit,
        amount_rm: amount,
        pdf_storage_path: path,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
        updated_at: new Date().toISOString(),
      });

      goBack();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Approve failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const employerLabels = request
    ? { [request.employer_user_id]: employerLabel ?? { full_name: "—", company_name: null, company_address: null } }
    : {};

  return (
    <DashboardLayout
      items={adminNavItems}
      userName={adminName}
      userEmail={adminEmail}
>
      <AdminPageFrame
        title="Review quotation request"
        subtitle="Set pricing from the course catalog, confirm PDF details, then approve or reject with a reason."
        errorMessage={errorMessage}
        isAuthChecking={viewerState.kind === "loading"}
        isAuthorized={viewerState.kind === "signedIn" && viewerState.viewer.role === "admin"}
        actions={
          <button type="button" onClick={goBack} className="sk-button-secondary px-3 py-2">
            Back to quotation requests
          </button>
        }
      >
        {isLoading && <p className="text-sm text-ink-muted">Loading quotation request…</p>}

        {!isLoading && !request && (
          <div className="sk-card p-6">
            <p className="text-sm text-ink-muted">Quotation request not found.</p>
            <button type="button" onClick={goBack} className="sk-button-secondary mt-4 px-3 py-2">
              Back to quotation requests
            </button>
          </div>
        )}

        {!isLoading && request && request.status !== "pending" && (
          <div className="sk-card p-6">
            <p className="text-sm text-ink-muted">
              This request is already {request.status}. Only pending requests can be reviewed here.
            </p>
            <button type="button" onClick={goBack} className="sk-button-secondary mt-4 px-3 py-2">
              Back to quotation requests
            </button>
          </div>
        )}

        {!isLoading && request && request.status === "pending" && (
          <AdminQuotationReviewPanel
            activeReview={request}
            employerLabels={employerLabels}
            companyName={companyName}
            companyAddress={companyAddress}
            courseMode={courseMode}
            unitPrice={unitPrice}
            amountRm={amountRm}
            isSaving={isSaving}
            onClose={goBack}
            onChangeCompanyName={setCompanyName}
            onChangeCompanyAddress={setCompanyAddress}
            onChangeCourseMode={setCourseMode}
            onChangeUnitPrice={setUnitPrice}
            onApprove={() => void handleApprove()}
            onReject={(reason) => void handleReject(reason)}
          />
        )}
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminQuotationReview;
