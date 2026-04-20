import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { adminNavItems } from "../../components/layout/navItems";
import { buildQuotationPdfBlob } from "../../features/quotation/buildQuotationPdf";
import { createQuotationPdfSignedUrl, uploadQuotationPdf } from "../../features/quotation/storage";
import type { QuotationRequestRow } from "../../features/quotation/types";
import { supabase } from "../../lib/supabaseClient";

type EmployerLabel = { full_name: string; company_name: string | null };

const AdminQuotations = () => {
  const [rows, setRows] = useState<QuotationRequestRow[]>([]);
  const [employerLabels, setEmployerLabels] = useState<Record<string, EmployerLabel>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [activeReview, setActiveReview] = useState<QuotationRequestRow | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [courseBookingDate, setCourseBookingDate] = useState("");
  const [courseMode, setCourseMode] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [amountRm, setAmountRm] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("quotation_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setRows([]);
      setIsLoading(false);
      return;
    }

    const list = (data ?? []) as QuotationRequestRow[];
    setRows(list);

    const ids = [...new Set(list.map((r) => r.employer_user_id))];
    if (ids.length > 0) {
      const { data: profs, error: pErr } = await supabase
        .from("user_profiles")
        .select("user_id,full_name,company_name")
        .in("user_id", ids);

      if (!pErr && profs) {
        const map: Record<string, EmployerLabel> = {};
        (profs as { user_id: string; full_name: string; company_name: string | null }[]).forEach(
          (p) => {
            map[p.user_id] = { full_name: p.full_name, company_name: p.company_name };
          }
        );
        setEmployerLabels(map);
      }
    } else {
      setEmployerLabels({});
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      setIsAuthChecking(true);
      setErrorMessage(null);

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setIsAuthChecking(false);
        setErrorMessage(error.message);
        return;
      }

      const user = data.session?.user;
      if (!user) {
        setIsAuthChecking(false);
        window.location.href = "/login";
        return;
      }

      setAdminEmail(user.email ?? null);

      const { data: profileRow, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id,role,status,full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError || !profileRow || profileRow.role !== "admin") {
        setIsAuthChecking(false);
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/login";
        return;
      }

      window.localStorage.setItem("skillkita-role", "admin");
      setAdminName((profileRow as { full_name?: string }).full_name ?? "Admin");
      setIsAuthChecking(false);
      await load();
    };

    void checkAdmin();
  }, [load]);

  useEffect(() => {
    if (activeReview) {
      setCompanyName(
        activeReview.company_name?.trim() || activeReview.company_name_snapshot || ""
      );
      setCourseBookingDate(activeReview.course_booking_date ?? "");
      setCourseMode(activeReview.course_mode ?? "");
      setUnitPrice(
        activeReview.unit_price != null ? String(activeReview.unit_price) : ""
      );
      setAmountRm(activeReview.amount_rm != null ? String(activeReview.amount_rm) : "");
    }
  }, [activeReview]);

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
    const { data: sessionData } = await supabase.auth.getSession();
    const reviewer = sessionData.session?.user?.id ?? null;

    const { error } = await supabase
      .from("quotation_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    setIsSaving(false);
    if (error) {
      setErrorMessage(error.message);
      return;
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
      !courseBookingDate.trim() ||
      !courseMode.trim() ||
      !Number.isFinite(unit) ||
      unit < 0 ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setErrorMessage(
        "Fill company name, course booking date, course mode, unit price (RM), and amount (RM) with valid numbers."
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      const pdfInput = {
        company_name: companyName.trim(),
        course_name: activeReview.course_name,
        course_booking_date: courseBookingDate,
        course_mode: courseMode.trim(),
        unit_price: unit,
        amount_rm: amount,
        number_of_employers: activeReview.number_of_employers,
        proposed_date: activeReview.proposed_date,
        additional_description: activeReview.additional_description,
      };

      const blob = buildQuotationPdfBlob(pdfInput);
      const path = await uploadQuotationPdf(
        activeReview.employer_user_id,
        activeReview.id,
        blob
      );

      const { data: sessionData } = await supabase.auth.getSession();
      const reviewer = sessionData.session?.user?.id ?? null;

      const { error } = await supabase
        .from("quotation_requests")
        .update({
          status: "approved",
          company_name: companyName.trim(),
          course_booking_date: courseBookingDate,
          course_mode: courseMode.trim(),
          unit_price: unit,
          amount_rm: amount,
          pdf_storage_path: path,
          reviewed_at: new Date().toISOString(),
          reviewed_by: reviewer,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeReview.id);

      if (error) {
        throw new Error(error.message);
      }

      closeReview();
      await load();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Approve failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const getEmployerDisplayName = (row: QuotationRequestRow): string => {
    const text = row.additional_description ?? "";
    const firstLine = text.split("\n")[0] ?? "";
    if (firstLine.toLowerCase().startsWith("employer:")) {
      const name = firstLine.slice("employer:".length).trim();
      if (name) return name;
    }
    return employerLabels[row.employer_user_id]?.full_name ?? `${row.employer_user_id.slice(0, 8)}…`;
  };

  const downloadPdf = async (path: string, quotationId: string) => {
    setDownloadId(quotationId);
    setErrorMessage(null);
    try {
      const url = await createQuotationPdfSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadId(null);
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
      {isAuthChecking ? (
        <p className="text-black">Checking access…</p>
      ) : (
        <p className="text-sm font-semibold text-[#7A1F1F]">
          <a href="/admin" className="underline">
            ← Back to manage courses
          </a>
        </p>
      )}
        <h1 className="mt-4 text-4xl font-bold text-[#0001fc]">Quotation requests</h1>
        <p className="mt-2 max-w-2xl text-sm text-black">
          Review employer submissions. Set company name (for the PDF), booking date, mode, unit price,
          and total amount (RM), then approve to generate the PDF. Employers download it from their
          quotation page.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {activeReview && activeReview.status === "pending" && (
          <section className="sk-card mt-8 p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h2 className="text-xl font-bold text-[#7A1F1F]">Review &amp; price</h2>
              <button
                type="button"
                onClick={closeReview}
                className="text-sm font-semibold text-[#7A1F1F] underline"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-[#efe1db] bg-[#faf7f2] p-4 text-sm">
              <p>
                <span className="font-semibold text-[#7A1F1F]">Employer:</span>{" "}
                {employerLabels[activeReview.employer_user_id]?.full_name ?? "—"}
                {employerLabels[activeReview.employer_user_id]?.company_name
                  ? ` (${employerLabels[activeReview.employer_user_id]!.company_name})`
                  : ""}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Course:</span> {activeReview.course_name}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Participants:</span>{" "}
                {activeReview.number_of_employers}
              </p>
              <p className="mt-1">
                <span className="font-semibold">Proposed date:</span> {activeReview.proposed_date}
              </p>
              {activeReview.additional_description && (
                <p className="mt-2 text-black/80">{activeReview.additional_description}</p>
              )}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Company name (on quotation PDF)
                </span>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Course booking date
                </span>
                <input
                  type="date"
                  value={courseBookingDate}
                  onChange={(e) => setCourseBookingDate(e.target.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Course mode</span>
                <input
                  value={courseMode}
                  onChange={(e) => setCourseMode(e.target.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                  placeholder="e.g. Face-to-face, Online, Hybrid"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Unit price (RM)
                </span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Amount (RM)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={amountRm}
                  onChange={(e) => setAmountRm(e.target.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleApprove()}
                className="sk-button-primary"
              >
                {isSaving ? "Saving…" : "Approve & generate PDF"}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleReject(activeReview)}
                className="sk-button-secondary border-red-200 text-red-800 hover:bg-red-50"
              >
                Reject
              </button>
            </div>
          </section>
        )}

        <section className="sk-card mt-8 p-6">
          <h2 className="text-xl font-bold text-[#7A1F1F]">All requests</h2>
          {isLoading && <p className="mt-4 text-sm">Loading…</p>}
          {!isLoading && rows.length === 0 && (
            <p className="mt-4 text-sm text-black">No quotation requests yet.</p>
          )}
          {!isLoading && rows.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#efe1db] text-[#7A1F1F]">
                    <th className="py-2 pr-3 font-semibold">Employer</th>
                    <th className="py-2 pr-3 font-semibold">Course</th>
                    <th className="py-2 pr-3 font-semibold">Proposed</th>
                    <th className="py-2 pr-3 font-semibold">Status</th>
                    <th className="py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-[#efe1db]">
                      <td className="py-3 pr-3 align-top">
                        {getEmployerDisplayName(r)}
                      </td>
                      <td className="py-3 pr-3 align-top">{r.course_name}</td>
                      <td className="py-3 pr-3 align-top">{r.proposed_date}</td>
                      <td className="py-3 pr-3 align-top capitalize">{r.status}</td>
                      <td className="py-3 align-top">
                        {r.status === "pending" && (
                          <button
                            type="button"
                            onClick={() => openReview(r)}
                            className="font-semibold text-[#0001fc] underline"
                          >
                            Review
                          </button>
                        )}
                        {r.status === "approved" && (
                          <>
                            {r.pdf_storage_path ? (
                              <button
                                type="button"
                                onClick={() => void downloadPdf(r.pdf_storage_path!, r.id)}
                                className="font-semibold text-[#0001fc] underline"
                                disabled={downloadId === r.id}
                              >
                                {downloadId === r.id ? "Preparing..." : "Download"}
                              </button>
                            ) : (
                              <span className="text-red-700">Missing PDF</span>
                            )}
                          </>
                        )}
                        {r.status === "rejected" && <span className="text-black/50">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </DashboardLayout>
  );
};

export default AdminQuotations;
