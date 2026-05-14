import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { employerNavItems } from "../../app/layout/navItems";
import {
  buildQuotationPdfDownloadFileName,
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

      if (row.status !== "approved") {
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
      setQuotationError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadQuotationId(null);
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
          Request access to private course documents (syllabus, trainer files). An admin must approve
          before you can open them.
        </p>

        <div className="mt-6 rounded-xl border border-[#0001fc]/20 bg-white p-4 shadow-sm">
          <p className="text-xl font-semibold text-[#7A1F1F]">Quotation Application History</p>
          <p className="mt-1 text-sm text-black/80">
            Request a formal quotation for a course. After admin sets pricing and approves, download your
            PDF below or from the quotation page.
          </p>
          <a
            href="/employer/quotation"
            className="mt-3 inline-block rounded-lg bg-[#0001fc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0001fc]/90"
          >
            Request a Quotation
          </a>

          {quotationError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {quotationError}
            </p>
          )}

          {quotationsLoading && (
            <p className="mt-4 text-sm text-black/70">Loading quotation history…</p>
          )}
          {!quotationsLoading && quotationRows.length === 0 && !quotationError && (
            <p className="mt-4 text-sm text-black/70">No quotation requests yet.</p>
          )}
          {!quotationsLoading && quotationRows.length > 0 && (
            <ul className="mt-4 space-y-3 border-t border-[#efe1db] pt-4">
              {quotationRows.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-[#efe1db] bg-[#faf7f2] p-4 text-sm text-black"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#0001fc]">{r.course_name}</p>
                      <p className="mt-1 text-sm text-black/80">
                        Submitted: {new Date(r.created_at).toLocaleString()}
                      </p>
                      <p className="mt-1 text-sm text-black/80">
                        Status:{" "}
                        <span className="font-semibold capitalize">
                          {r.status === "pending" && "Pending admin review"}
                          {r.status === "approved" && "Approved — PDF ready"}
                          {r.status === "rejected" && "Rejected"}
                        </span>
                      </p>
                    </div>
                    {r.status === "approved" && r.pdf_storage_path && (
                      <button
                        type="button"
                        disabled={downloadQuotationId === r.id}
                        onClick={() => void downloadQuotationPdf(r)}
                        className="sk-button-primary shrink-0 px-4 py-2 text-sm"
                      >
                        {downloadQuotationId === r.id ? "Opening…" : "Download PDF"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        
    </DashboardLayout>
  );
};

export default EmployerDashboard;

