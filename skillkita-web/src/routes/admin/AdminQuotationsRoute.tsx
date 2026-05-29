import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { buildQuotationPdfBlob } from "../../features/quotation/buildQuotationPdf";
import {
  quotationRowToPdfInput,
  quotationRowToPdfMeta,
} from "../../features/quotation/quotationRowToPdf";
import {
  buildInvoicePdfDownloadFileName,
  buildQuotationPdfDownloadFileName,
  deleteQuotationPdf,
  downloadBlobWithFileName,
  downloadQuotationPdfWithFileName,
  uploadQuotationPdf,
} from "../../features/quotation/storage";
import type { QuotationRequestRow } from "../../features/quotation/types";
import { AdminQuotationReviewPanel } from "../../features/quotation/components/AdminQuotationReviewPanel";
import { AdminQuotationRequestsTable } from "../../features/quotation/components/AdminQuotationRequestsTable";
import {
  deleteQuotationRequest,
  listEmployerLabels,
  listQuotationRequests,
  updateQuotationRequest,
} from "../../features/quotation/api/quotationRequestsApi";
import { supabase } from "../../shared/api/supabaseClient";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";
import { useViewer } from "../../shared/hooks/useViewer";

type EmployerLabel = {
  full_name: string;
  company_name: string | null;
  company_address: string | null;
};

const AdminQuotations = () => {
  const [rows, setRows] = useState<QuotationRequestRow[]>([]);
  const [employerLabels, setEmployerLabels] = useState<Record<string, EmployerLabel>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [invoiceDownloadId, setInvoiceDownloadId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeReview, setActiveReview] = useState<QuotationRequestRow | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [courseMode, setCourseMode] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [amountRm, setAmountRm] = useState("");

  const viewerState = useViewer();

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const list = await listQuotationRequests();
      setRows(list);

      const ids = [...new Set(list.map((r) => r.employer_user_id))];
      const labels = await listEmployerLabels(ids);
      setEmployerLabels(labels);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to load quotation requests.");
      setRows([]);
      setEmployerLabels({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewerState.kind === "signedIn") {
      setAdminEmail(viewerState.viewer.email);
      setAdminName(viewerState.viewer.fullName || "Admin");
    }
  }, [viewerState]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (activeReview) {
      setCompanyName(activeReview.company_name?.trim() || activeReview.company_name_snapshot || "");
      setCompanyAddress(
        activeReview.company_address?.trim() ||
          employerLabels[activeReview.employer_user_id]?.company_address?.trim() ||
          ""
      );
      setCourseMode(activeReview.course_mode ?? "");
      const requestedUnit = activeReview.unit_price != null ? activeReview.unit_price : null;
      setUnitPrice(requestedUnit != null ? String(requestedUnit) : "");
      const suggestedAmount =
        requestedUnit != null
          ? requestedUnit * activeReview.number_of_employers
          : null;
      setAmountRm(
        activeReview.amount_rm != null
          ? String(activeReview.amount_rm)
          : suggestedAmount != null
            ? String(suggestedAmount)
            : ""
      );
    }
  }, [activeReview, employerLabels]);

  const openReview = (row: QuotationRequestRow) => {
    setErrorMessage(null);
    setActiveReview(row);
  };

  const closeReview = () => {
    setActiveReview(null);
  };

  const handleReject = async (row: QuotationRequestRow) => {
    setIsSaving(true);
    setErrorMessage(null);
    const reviewer = viewerState.kind === "signedIn" ? viewerState.viewer.userId : null;

    try {
      await updateQuotationRequest(row.id, {
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Reject failed.");
      return;
    } finally {
      setIsSaving(false);
    }
    if (activeReview?.id === row.id) closeReview();
    await load();
  };

  const handleApprove = async () => {
    if (!activeReview) return;

    const unit = parseFloat(unitPrice);
    const amount = parseFloat(amountRm);
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
        course_name: activeReview.course_name,
        course_mode: courseMode.trim(),
        unit_price: unit,
        amount_rm: amount,
        number_of_employers: activeReview.number_of_employers,
        proposed_date: activeReview.proposed_date,
        additional_description: activeReview.additional_description,
        course_location_address: activeReview.course_location_address,
      };

      const blob = await buildQuotationPdfBlob(pdfInput, {
        quotation_id:
          activeReview.quotation_no != null ? String(activeReview.quotation_no) : activeReview.id,
        approved_date: new Date().toISOString(),
        employer_company_address: companyAddress.trim() || undefined,
      });
      const path = await uploadQuotationPdf(activeReview.employer_user_id, activeReview.id, blob);

      const reviewer = viewerState.kind === "signedIn" ? viewerState.viewer.userId : null;
      await updateQuotationRequest(activeReview.id, {
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

      closeReview();
      await load();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Approve failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadQuotationPdf = async (row: QuotationRequestRow) => {
    if (!row.pdf_storage_path) return;
    setDownloadId(row.id);
    setErrorMessage(null);
    try {
      await downloadQuotationPdfWithFileName(
        row.pdf_storage_path,
        buildQuotationPdfDownloadFileName(row)
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Quotation download failed.");
    } finally {
      setDownloadId(null);
    }
  };

  const downloadInvoicePdf = async (row: QuotationRequestRow) => {
    const pdfInput = quotationRowToPdfInput(row);
    if (!pdfInput) {
      setErrorMessage("Invoice requires approved pricing (company, mode, unit price, and amount).");
      return;
    }

    setInvoiceDownloadId(row.id);
    setErrorMessage(null);
    try {
      const blob = await buildQuotationPdfBlob(pdfInput, quotationRowToPdfMeta(row, "invoice"));
      downloadBlobWithFileName(blob, buildInvoicePdfDownloadFileName(row));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Invoice download failed.");
    } finally {
      setInvoiceDownloadId(null);
    }
  };

  const handleDelete = async (row: QuotationRequestRow) => {
    const ok = window.confirm(
      `Delete this quotation request?\n\nCourse: ${row.course_name}\nStatus: ${row.status}\n\nThis cannot be undone.`
    );
    if (!ok) return;

    setDeleteId(row.id);
    setErrorMessage(null);
    try {
      // Delete the DB row FIRST. If RLS blocks this, do not delete the PDF.
      await deleteQuotationRequest(row.id);

      setRows((p) => p.filter((r) => r.id !== row.id));
      if (activeReview?.id === row.id) closeReview();

      // Best-effort cleanup of the PDF in storage after the request is deleted.
      if (row.pdf_storage_path) {
        try {
          await deleteQuotationPdf(row.pdf_storage_path);
        } catch (e) {
          setErrorMessage(
            (e instanceof Error ? e.message : "PDF delete failed.") +
              " The request was deleted, but PDF cleanup failed."
          );
        }
      }

      await load();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setDeleteId(null);
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
        title="Quotation requests"
        subtitle="Review employer submissions, approve to generate a quotation PDF, then download quotation or invoice for approved requests. Employers download quotations from their dashboard."
        errorMessage={errorMessage}
        isAuthChecking={viewerState.kind === "loading"}
        isAuthorized={viewerState.kind === "signedIn" && viewerState.viewer.role === "admin"}
        actions={
          <a href="/admin" className="sk-button-secondary px-3 py-2">
            Back to manage courses
          </a>
        }
      >
        {activeReview && activeReview.status === "pending" && (
          <AdminQuotationReviewPanel
            activeReview={activeReview}
            employerLabels={employerLabels}
            companyName={companyName}
            companyAddress={companyAddress}
            courseMode={courseMode}
            unitPrice={unitPrice}
            amountRm={amountRm}
            isSaving={isSaving}
            onClose={closeReview}
            onChangeCompanyName={setCompanyName}
            onChangeCompanyAddress={setCompanyAddress}
            onChangeCourseMode={setCourseMode}
            onChangeUnitPrice={setUnitPrice}
            onChangeAmountRm={setAmountRm}
            onApprove={() => void handleApprove()}
            onReject={() => void handleReject(activeReview)}
          />
        )}

        <AdminQuotationRequestsTable
          rows={rows}
          employerLabels={employerLabels}
          isLoading={isLoading}
          downloadId={downloadId}
          invoiceDownloadId={invoiceDownloadId}
          deleteId={deleteId}
          isSaving={isSaving}
          onReview={openReview}
          onDownloadQuotation={(row) => void downloadQuotationPdf(row)}
          onDownloadInvoice={(row) => void downloadInvoicePdf(row)}
          onDeleteRequest={(row) => void handleDelete(row)}
        />
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminQuotations;

