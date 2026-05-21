import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { employerNavItems } from "../../app/layout/navItems";
import { buildQuotationPdfBlob } from "../../features/quotation/buildQuotationPdf";
import { EmployerQuotationRequestsTable } from "../../features/quotation/components/EmployerQuotationRequestsTable";
import {
  quotationRowToPdfInput,
  quotationRowToPdfMeta,
} from "../../features/quotation/quotationRowToPdf";
import {
  buildInvoicePdfDownloadFileName,
  buildQuotationPdfDownloadFileName,
  downloadBlobWithFileName,
  downloadQuotationPdfWithFileName,
} from "../../features/quotation/storage";
import type { QuotationRequestRow } from "../../features/quotation/types";
import { supabase } from "../../shared/api/supabaseClient";
import { signOutAndRedirectHome } from "../../shared/auth/signOutAndRedirectHome";

type UserProfileRow = {
  user_id: string;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  full_name: string;
  company_name: string | null;
};

const EmployerDashboard = () => {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotationRows, setQuotationRows] = useState<QuotationRequestRow[]>([]);
  const [quotationsLoading, setQuotationsLoading] = useState(true);
  const [quotationError, setQuotationError] = useState<string | null>(null);
  const [downloadQuotationId, setDownloadQuotationId] = useState<string | null>(null);
  const [downloadInvoiceId, setDownloadInvoiceId] = useState<string | null>(null);

  const loadQuotations = useCallback(async (userId: string) => {
    setQuotationsLoading(true);
    setQuotationError(null);
    const { data, error } = await supabase
      .from("quotation_requests")
      .select("*")
      .eq("employer_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setQuotationError(error.message);
      setQuotationRows([]);
    } else {
      setQuotationRows((data ?? []) as QuotationRequestRow[]);
    }
    setQuotationsLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      setErrorMessage(null);
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const user = data.session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? null);

      const { data: profileRow, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id,role,status,full_name,company_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(profileError.message);
        return;
      }

      if (!profileRow) {
        window.location.href = "/login";
        return;
      }

      const row = profileRow as UserProfileRow;
      setProfile(row);

      if (row.role !== "employer") {
        window.location.href = "/";
        return;
      }

      if (row.status === "rejected") {
        window.location.href = "/login";
        return;
      }

      await loadQuotations(user.id);
    };

    void load();
  }, [loadQuotations]);

  const downloadQuotationPdf = async (row: QuotationRequestRow) => {
    if (!row.pdf_storage_path) return;
    setDownloadQuotationId(row.id);
    setQuotationError(null);
    try {
      await downloadQuotationPdfWithFileName(
        row.pdf_storage_path,
        buildQuotationPdfDownloadFileName(row)
      );
    } catch (err) {
      setQuotationError(err instanceof Error ? err.message : "Quotation download failed.");
    } finally {
      setDownloadQuotationId(null);
    }
  };

  const downloadInvoicePdf = async (row: QuotationRequestRow) => {
    const pdfInput = quotationRowToPdfInput(row);
    if (!pdfInput) {
      setQuotationError("Invoice requires approved pricing (company, mode, unit price, and amount).");
      return;
    }

    setDownloadInvoiceId(row.id);
    setQuotationError(null);
    try {
      const blob = await buildQuotationPdfBlob(pdfInput, quotationRowToPdfMeta(row, "invoice"));
      downloadBlobWithFileName(blob, buildInvoicePdfDownloadFileName(row));
    } catch (err) {
      setQuotationError(err instanceof Error ? err.message : "Invoice download failed.");
    } finally {
      setDownloadInvoiceId(null);
    }
  };

  return (
    <DashboardLayout
      items={employerNavItems}
      userName={profile?.full_name ?? "Employer"}
      userEmail={email}
      onLogout={() => {
        void signOutAndRedirectHome();
      }}
    >
        
        <p className="mt-3 text-lg text-black md:text-xl">
          {profile ? `Welcome, ${profile.full_name}.` : "Welcome."}
        </p>
        <p className="mt-2 text-sm text-black/80">
          View your quotation requests and download your quotation PDF along with the invoice PDF.
        </p>

        {quotationError && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {quotationError}
          </div>
        )}

        <EmployerQuotationRequestsTable
          rows={quotationRows}
          isLoading={quotationsLoading}
          downloadId={downloadQuotationId}
          invoiceDownloadId={downloadInvoiceId}
          onDownloadQuotation={(row) => void downloadQuotationPdf(row)}
          onDownloadInvoice={(row) => void downloadInvoicePdf(row)}
        />

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        
    </DashboardLayout>
  );
};

export default EmployerDashboard;

