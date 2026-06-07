import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { buildQuotationPdfBlob } from "../../features/quotation/buildQuotationPdf";
import {
  resolveQuotationPdfInput,
  quotationRowToPdfMeta,
} from "../../features/quotation/quotationRowToPdf";
import {
  buildInvoicePdfDownloadFileName,
  buildQuotationPdfDownloadFileName,
  deleteQuotationPdf,
  downloadBlobWithFileName,
} from "../../features/quotation/storage";
import type { QuotationRequestRow } from "../../features/quotation/types";
import { AdminQuotationRequestsTable } from "../../features/quotation/components/AdminQuotationRequestsTable";
import {
  deleteQuotationRequest,
  listEmployerLabels,
  listQuotationRequests,
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
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [invoiceDownloadId, setInvoiceDownloadId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
      setAdminName(viewerState.viewer.displayName || "Admin");
    }
  }, [viewerState]);

  useEffect(() => {
    void load();
  }, [load]);

  const downloadQuotationPdf = async (row: QuotationRequestRow) => {
    const pdfInput = await resolveQuotationPdfInput(row);
    if (!pdfInput) {
      setErrorMessage("Quotation requires approved pricing (company, mode, and course price).");
      return;
    }

    setDownloadId(row.id);
    setErrorMessage(null);
    try {
      const blob = await buildQuotationPdfBlob(pdfInput, quotationRowToPdfMeta(row, "quotation"));
      downloadBlobWithFileName(blob, buildQuotationPdfDownloadFileName(row));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Quotation download failed.");
    } finally {
      setDownloadId(null);
    }
  };

  const downloadInvoicePdf = async (row: QuotationRequestRow) => {
    const pdfInput = await resolveQuotationPdfInput(row);
    if (!pdfInput) {
      setErrorMessage("Invoice requires approved pricing (company, mode, and course price).");
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
      await deleteQuotationRequest(row.id);

      setRows((p) => p.filter((r) => r.id !== row.id));

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
      >
        <AdminQuotationRequestsTable
          rows={rows}
          employerLabels={employerLabels}
          isLoading={isLoading}
          downloadId={downloadId}
          invoiceDownloadId={invoiceDownloadId}
          deleteId={deleteId}
          onDownloadQuotation={(row) => void downloadQuotationPdf(row)}
          onDownloadInvoice={(row) => void downloadInvoicePdf(row)}
          onDeleteRequest={(row) => void handleDelete(row)}
        />
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminQuotations;
