import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { adminNavItems } from "../../components/layout/navItems";
import { buildQuotationPdfBlob } from "../../features/quotation/buildQuotationPdf";
import { uploadQuotationPdf } from "../../features/quotation/storage";
import type { QuotationRequestRow } from "../../features/quotation/types";
import { supabase } from "../../lib/supabaseClient";

type EmployerLabel = { full_name: string; company_name: string | null };

const AdminCreateQuotation = () => {
  const [approvedEmployers, setApprovedEmployers] = useState<(EmployerLabel & { user_id: string })[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Admin-created quotation (auto-approved)
  const [createEmployerUserId, setCreateEmployerUserId] = useState("");
  const [createManualEmployerName, setCreateManualEmployerName] = useState("");
  const [createCompanyName, setCreateCompanyName] = useState("");
  const [createCourseName, setCreateCourseName] = useState("");
  const [createParticipants, setCreateParticipants] = useState("");
  const [createProposedDate, setCreateProposedDate] = useState("");
  const [createAdditionalDescription, setCreateAdditionalDescription] = useState("");
  const [createCourseBookingDate, setCreateCourseBookingDate] = useState("");
  const [createCourseMode, setCreateCourseMode] = useState("");
  const [createUnitPrice, setCreateUnitPrice] = useState("");
  const [createAmountRm, setCreateAmountRm] = useState("");

  const loadApprovedEmployers = useCallback(async () => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("user_id,full_name,company_name,role,status")
      .eq("role", "employer")
      .eq("status", "approved")
      .order("full_name", { ascending: true });

    if (error) {
      setApprovedEmployers([]);
      return;
    }

    setApprovedEmployers(
      (data ?? []).map((r) => ({
        user_id: (r as { user_id: string }).user_id,
        full_name: (r as { full_name: string }).full_name,
        company_name: (r as { company_name: string | null }).company_name,
      }))
    );
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
      await loadApprovedEmployers();
    };

    void checkAdmin();
  }, [loadApprovedEmployers]);

  const createEmployerOptions = useMemo(() => {
    return approvedEmployers.map((e) => ({
      value: e.user_id,
      label: `${e.full_name}${e.company_name ? ` (${e.company_name})` : ""}`,
      company_name: e.company_name,
    }));
  }, [approvedEmployers]);

  const isManualEmployer = createEmployerUserId === "__manual__";

  useEffect(() => {
    if (isManualEmployer) return;
    const match = approvedEmployers.find((e) => e.user_id === createEmployerUserId);
    if (!match) return;
    if (!createCompanyName.trim() && match.company_name?.trim()) {
      setCreateCompanyName(match.company_name);
    }
  }, [approvedEmployers, createCompanyName, createEmployerUserId, isManualEmployer]);

  const handleAdminCreate = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    setErrorMessage(null);

    const participants = parseInt(createParticipants, 10);
    const unit = parseFloat(createUnitPrice);
    const amount = parseFloat(createAmountRm);

    const manualEmployerName = createManualEmployerName.trim();
    const hasEmployer = (!!createEmployerUserId && !isManualEmployer) || (isManualEmployer && !!manualEmployerName);

    if (
      !hasEmployer ||
      !createCompanyName.trim() ||
      !createCourseName.trim() ||
      !Number.isFinite(participants) ||
      participants < 1 ||
      !createProposedDate ||
      !createCourseBookingDate ||
      !createCourseMode.trim() ||
      !Number.isFinite(unit) ||
      unit < 0 ||
      !Number.isFinite(amount) ||
      amount < 0
    ) {
      setErrorMessage(
        "Fill employer (or manual employer name), company name, course name, participants (≥1), proposed date, booking date, mode, unit price (RM), and amount (RM)."
      );
      return;
    }

    setIsSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const reviewer = sessionData.session?.user?.id ?? null;
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
        course_name: createCourseName.trim(),
        number_of_employers: participants,
        proposed_date: createProposedDate,
        additional_description: mergedAdditional,
        status: "approved" as const,
        company_name: createCompanyName.trim(),
        course_booking_date: createCourseBookingDate,
        course_mode: createCourseMode.trim(),
        unit_price: unit,
        amount_rm: amount,
        reviewed_at: new Date().toISOString(),
        reviewed_by: reviewer,
        updated_at: new Date().toISOString(),
      };

      const { data: inserted, error: insErr } = await supabase
        .from("quotation_requests")
        .insert(payload)
        .select("*")
        .maybeSingle();

      if (insErr) {
        const hint = insErr.message.toLowerCase().includes("row-level security")
          ? " (RLS) Run skillkita-web/supabase/quotations.sql in Supabase SQL editor to add the admin insert policy."
          : "";
        throw new Error(insErr.message + hint);
      }
      if (!inserted) throw new Error("Failed to create quotation.");

      const created = inserted as QuotationRequestRow;

      const pdfInput = {
        company_name: createCompanyName.trim(),
        course_name: createCourseName.trim(),
        course_booking_date: createCourseBookingDate,
        course_mode: createCourseMode.trim(),
        unit_price: unit,
        amount_rm: amount,
        number_of_employers: participants,
        proposed_date: createProposedDate,
        additional_description: mergedAdditional,
      };

      const blob = buildQuotationPdfBlob(pdfInput);
      const path = await uploadQuotationPdf(targetEmployerUserId, created.id, blob);

      const { error: updErr } = await supabase
        .from("quotation_requests")
        .update({
          pdf_storage_path: path,
          updated_at: new Date().toISOString(),
        })
        .eq("id", created.id);

      if (updErr) throw new Error(updErr.message);

      setCreateEmployerUserId("");
      setCreateManualEmployerName("");
      setCreateCompanyName("");
      setCreateCourseName("");
      setCreateParticipants("");
      setCreateProposedDate("");
      setCreateAdditionalDescription("");
      setCreateCourseBookingDate("");
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
      {isAuthChecking ? (
        <p className="text-black">Checking access…</p>
      ) : (
        <p className="text-sm font-semibold text-[#7A1F1F]">
          <a href="/admin/quotations" className="underline">
            ← Back to quotation requests
          </a>
        </p>
      )}

      <h1 className="mt-4 text-4xl font-bold text-[#0001fc]">Create quotation</h1>
      <p className="mt-2 text-sm text-black">
        Admin-created quotations are automatically approved. Fill all details and a PDF will be generated immediately.
      </p>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="sk-card mt-8 p-6">
        <form className="space-y-4" onSubmit={(ev) => void handleAdminCreate(ev)}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Employer</span>
              <select
                value={createEmployerUserId}
                onChange={(e) => setCreateEmployerUserId(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                required
              >
                <option value="" disabled>
                  Select an employer...
                </option>
                <option value="__manual__">Manual / not listed</option>
                {createEmployerOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            {isManualEmployer && (
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Employer name</span>
                <input
                  value={createManualEmployerName}
                  onChange={(e) => setCreateManualEmployerName(e.target.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                  placeholder="Type employer name"
                  required
                />
                <p className="mt-1 text-xs text-black/60">
                  Manual quotations are stored under the admin account; employers won’t see them unless they have an account.
                </p>
              </label>
            )}

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Company name (PDF)</span>
              <input
                value={createCompanyName}
                onChange={(e) => setCreateCompanyName(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                required
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Course name</span>
              <input
                value={createCourseName}
                onChange={(e) => setCreateCourseName(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Participants</span>
              <input
                type="number"
                min={1}
                value={createParticipants}
                onChange={(e) => setCreateParticipants(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Proposed date</span>
              <input
                type="date"
                value={createProposedDate}
                onChange={(e) => setCreateProposedDate(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                required
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                Additional description <span className="font-normal text-black/50">(optional)</span>
              </span>
              <textarea
                value={createAdditionalDescription}
                onChange={(e) => setCreateAdditionalDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                placeholder="Notes / venue / contacts..."
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Course booking date</span>
              <input
                type="date"
                value={createCourseBookingDate}
                onChange={(e) => setCreateCourseBookingDate(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Course mode</span>
              <input
                value={createCourseMode}
                onChange={(e) => setCreateCourseMode(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                placeholder="e.g. Face-to-face, Online"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Unit price (RM)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={createUnitPrice}
                onChange={(e) => setCreateUnitPrice(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Amount (RM)</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={createAmountRm}
                onChange={(e) => setCreateAmountRm(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                required
              />
            </label>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={isSaving} className="sk-button-primary">
              {isSaving ? "Saving…" : "Create & generate PDF"}
            </button>
          </div>
        </form>
      </section>
    </DashboardLayout>
  );
};

export default AdminCreateQuotation;

