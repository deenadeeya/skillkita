import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { employerNavItems } from "../../components/layout/navItems";
import { createQuotationPdfSignedUrl } from "../../features/quotation/storage";
import type { QuotationRequestRow } from "../../features/quotation/types";
import { supabase } from "../../lib/supabaseClient";

type ProfileRow = {
  user_id: string;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  full_name: string;
  company_name: string | null;
};

const EmployerQuotationRequest = () => {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<QuotationRequestRow[]>([]);
  const [courseName, setCourseName] = useState("");
  const [numberOfEmployers, setNumberOfEmployers] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [additionalDescription, setAdditionalDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadId, setDownloadId] = useState<string | null>(null);

  const loadRows = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("quotation_requests")
      .select("*")
      .eq("employer_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setRows([]);
      setErrorMessage(error.message);
      return;
    }
    setRows((data ?? []) as QuotationRequestRow[]);
  }, []);

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      const { data: sessionData, error: sErr } = await supabase.auth.getSession();
      if (sErr || !sessionData.session?.user) {
        window.location.href = "/login";
        return;
      }
      const user = sessionData.session.user;
      setEmail(user.email ?? null);

      const { data: profileRow, error: pErr } = await supabase
        .from("user_profiles")
        .select("user_id,role,status,full_name,company_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (pErr || !profileRow) {
        window.location.href = "/login";
        return;
      }

      const pr = profileRow as ProfileRow;
      if (pr.role !== "employer" || pr.status !== "approved") {
        window.location.href = "/login";
        return;
      }

      setProfile(pr);
      await loadRows(user.id);
      setIsLoading(false);
    };
    void run();
  }, [loadRows]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const n = parseInt(numberOfEmployers, 10);
    if (!courseName.trim() || !proposedDate || !Number.isFinite(n) || n < 1) {
      setErrorMessage("Please fill course name, a valid number of participants (≥ 1), and proposed date.");
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid || !profile) return;

    const snapshot =
      profile.company_name?.trim() || `${profile.full_name} (no company name on profile)`;

    setIsSubmitting(true);
    const { error } = await supabase.from("quotation_requests").insert({
      employer_user_id: uid,
      company_name_snapshot: snapshot,
      course_name: courseName.trim(),
      number_of_employers: n,
      proposed_date: proposedDate,
      additional_description: additionalDescription.trim() || null,
      status: "pending",
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(
        error.message +
          (error.message.toLowerCase().includes("row-level security")
            ? " Run supabase/quotations.sql in the SQL editor if this table is new."
            : "")
      );
      return;
    }

    setCourseName("");
    setNumberOfEmployers("");
    setProposedDate("");
    setAdditionalDescription("");
    await loadRows(uid);
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
      items={employerNavItems}
      userName={profile?.full_name ?? "Employer"}
      userEmail={email}
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
        <div className="flex flex-col items-center text-center">
          <a
            href="/employer"
            className="sk-button-secondary rounded-xl px-5 py-2.5 text-sm font-semibold no-underline"
          >
            ← Back to employer dashboard
          </a>
          <h1 className="mt-6 text-4xl font-bold text-[#0001fc] md:text-5xl">Request a Quotation</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-black">
            Submit your course details below. An administrator will review your request, set pricing, and
            approve it. When approved, you can download your quotation as a PDF from this page.
          </p>
        </div>

        {errorMessage && (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="sk-card mx-auto mt-8 max-w-2xl overflow-hidden p-6 md:p-8">
          <div className="border-b border-black/5 pb-5">
            <h2 className="text-xl font-bold text-[#7A1F1F] md:text-2xl">New Quotation Application</h2>
            <p className="mt-2 text-sm leading-relaxed text-black/70">
              Fill in the details below. Fields marked with your profile company are shown for your
              reference.
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-[#0001fc]/15 bg-gradient-to-br from-white to-[#f8f7ff] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7A1F1F]">
              Company on file
            </p>
            <p className="mt-1 text-sm font-semibold text-[#0001fc]">
              {profile?.company_name?.trim() || "— (add company in profile if missing)"}
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={(ev) => void handleSubmit(ev)}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-[#7A1F1F]">Course name</span>
                <input
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#7A1F1F]/35 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                  placeholder="e.g. HRD Corp–claimable leadership workshop"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-[#7A1F1F]">
                  Number of participants
                </span>
                <input
                  type="number"
                  min={1}
                  value={numberOfEmployers}
                  onChange={(e) => setNumberOfEmployers(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-[#7A1F1F]/35 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-[#7A1F1F]">Proposed date</span>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-[#7A1F1F]/35 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                  required
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#7A1F1F]">
                Additional description
                <span className="ml-1 font-normal text-black/50">(optional)</span>
              </span>
              <textarea
                value={additionalDescription}
                onChange={(e) => setAdditionalDescription(e.target.value)}
                rows={4}
                className="min-h-[7rem] w-full resize-y rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#7A1F1F]/35 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                placeholder="Venue preferences, cohort size, contact person, etc."
              />
            </label>
            <div className="flex justify-center border-t border-black/5 pt-6">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="sk-button-primary min-w-[10rem] rounded-xl px-8 py-2.5 text-base shadow-md shadow-[#7A1F1F]/15 transition hover:shadow-lg hover:shadow-[#7A1F1F]/20 disabled:shadow-none"
              >
                {isSubmitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </section>

        <section className="sk-card mt-10 p-6">
          <h2 className="text-xl font-bold text-[#7A1F1F]">Quotation Application History</h2>
          {isLoading && <p className="mt-4 text-sm text-black">Loading…</p>}
          {!isLoading && rows.length === 0 && (
            <p className="mt-4 text-sm text-black">No quotation requests yet.</p>
          )}
          {!isLoading && rows.length > 0 && (
            <ul className="mt-4 space-y-4">
              {rows.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-[#efe1db] bg-[#faf7f2] p-4 text-sm text-black"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#0001fc]">{r.course_name}</p>
                      <p className="mt-1 text-black/80">
                        Proposed: {r.proposed_date} · Participants: {r.number_of_employers}
                      </p>
                      <p className="mt-1">
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
                        disabled={downloadId === r.id}
                        onClick={() => void downloadPdf(r.pdf_storage_path!, r.id)}
                        className="sk-button-primary shrink-0 px-4 py-2 text-sm"
                      >
                        {downloadId === r.id ? "Opening…" : "Download PDF"}
                      </button>
                    )}
                  </div>
                  {r.additional_description && (
                    <p className="mt-2 border-t border-[#efe1db] pt-2 text-xs text-black/75">
                      {r.additional_description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
    </DashboardLayout>
  );
};

export default EmployerQuotationRequest;
