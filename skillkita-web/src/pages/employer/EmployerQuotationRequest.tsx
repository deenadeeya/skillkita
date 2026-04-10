import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { createQuotationPdfSignedUrl } from "../../features/quotation/storage";
import type { QuotationRequestRow } from "../../features/quotation/types";
import SiteHeader from "../../components/layout/SiteHeader";
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
      setErrorMessage("Please fill course name, a valid number of employers (≥ 1), and proposed date.");
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
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      <SiteHeader />

      <main className="sk-container py-12">
        <p className="text-sm font-semibold text-[#7A1F1F]">
          <a href="/employer" className="underline">
            ← Back to employer dashboard
          </a>
        </p>
        <h1 className="mt-4 text-4xl font-bold text-[#0001fc] md:text-5xl">Request a quotation</h1>
        <p className="mt-3 max-w-2xl text-lg text-black">
          Submit your course details below. An administrator will review your request, set pricing, and
          approve it. When approved, you can download your quotation as a PDF from this page.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="sk-card mt-8 max-w-xl p-6">
          <h2 className="text-xl font-bold text-[#7A1F1F]">New request</h2>
          <p className="mt-2 text-sm text-black/80">
            Company on file:{" "}
            <span className="font-semibold text-black">
              {profile?.company_name?.trim() || "— (add company in profile if missing)"}
            </span>
          </p>

          <form className="mt-6 space-y-4" onSubmit={(ev) => void handleSubmit(ev)}>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Course name</span>
              <input
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                placeholder="e.g. HRD Corp–claimable leadership workshop"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                Number of employers (participants)
              </span>
              <input
                type="number"
                min={1}
                value={numberOfEmployers}
                onChange={(e) => setNumberOfEmployers(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Proposed date</span>
              <input
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                Additional description
              </span>
              <textarea
                value={additionalDescription}
                onChange={(e) => setAdditionalDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                placeholder="Venue preferences, cohort size, contact person, etc."
              />
            </label>
            <button type="submit" disabled={isSubmitting || isLoading} className="sk-button-primary">
              {isSubmitting ? "Submitting…" : "Submit for review"}
            </button>
          </form>
        </section>

        <section className="sk-card mt-10 p-6">
          <h2 className="text-xl font-bold text-[#7A1F1F]">Your requests</h2>
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
      </main>
    </div>
  );
};

export default EmployerQuotationRequest;
