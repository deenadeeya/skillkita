import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../../app/layout/DashboardLayout";
import { employerNavItems } from "../../../app/layout/navItems";
import { signOutAndRedirectHome } from "../../../shared/auth/signOutAndRedirectHome";
import { useViewer } from "../../../shared/hooks/useViewer";
import { RequiredMark } from "../../../shared/ui/RequiredMark";
import { insertDocumentSubmission, listMyDocumentSubmissions } from "../submissionsApi";
import { getSubmissionFileSignedUrl, uploadEmployerSubmissionFile } from "../submissionsStorage";
import type { DocumentSubmissionRow, DocumentSubmissionType } from "../types";

type Props = {
  submissionType: DocumentSubmissionType;
  title: string;
  subtitle: string;
  fileInputLabel: string;
  fileAccept: string;
  fileHelp: string;
};

export function DocumentSubmissionEmployerPage({
  submissionType,
  title,
  subtitle,
  fileInputLabel,
  fileAccept,
  fileHelp,
}: Props) {
  const viewerState = useViewer();
  const [rows, setRows] = useState<DocumentSubmissionRow[]>([]);
  const [courseName, setCourseName] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openingPath, setOpeningPath] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMessage(null);
    try {
      const list = await listMyDocumentSubmissions(submissionType);
      setRows(list);
    } catch (e) {
      setRows([]);
      setErrorMessage(e instanceof Error ? e.message : "Failed to load submissions.");
    }
  }, [submissionType]);

  useEffect(() => {
    setIsLoading(true);
    void load().finally(() => setIsLoading(false));
  }, [load]);

  const openFile = async (path: string) => {
    setOpeningPath(path);
    setErrorMessage(null);
    try {
      const url = await getSubmissionFileSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not open file.");
    } finally {
      setOpeningPath(null);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!courseName.trim() || !proposedDate || !file) {
      setErrorMessage("Please fill course name, proposed date, and attach a file.");
      return;
    }

    if (viewerState.kind !== "signedIn") {
      setErrorMessage("Not authenticated.");
      return;
    }
    const viewer = viewerState.viewer;
    if (viewer.role !== "employer" || viewer.status !== "approved") {
      setErrorMessage("Employer account not approved.");
      return;
    }

    if (submissionType === "jd14" && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("JD14 must be a PDF file.");
      return;
    }

    if (submissionType === "payment_receipt") {
      const ok =
        file.type === "application/pdf" ||
        file.type.startsWith("image/") ||
        /\.(pdf|png|jpe?g|webp|gif)$/i.test(file.name);
      if (!ok) {
        setErrorMessage("Payment receipt must be a PDF or an image (PNG, JPG, WebP, GIF).");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const path = await uploadEmployerSubmissionFile(file, submissionType, viewer.userId);
      await insertDocumentSubmission({
        submission_type: submissionType,
        course_name: courseName.trim(),
        proposed_date: proposedDate,
        file_storage_path: path,
      });
      setCourseName("");
      setProposedDate("");
      setFile(null);
      await load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      items={employerNavItems}
      userName={viewerState.kind === "signedIn" ? viewerState.viewer.fullName : "Employer"}
      userEmail={viewerState.kind === "signedIn" ? viewerState.viewer.email : null}
      onLogout={() => {
        void signOutAndRedirectHome();
      }}
    >
      <div className="mx-auto w-full max-w-3xl text-left">
        <h1 className="text-2xl font-extrabold text-[#0001fc] md:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-black/75">{subtitle}</p>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMessage}</div>
        )}

        <form className="sk-card mt-6 space-y-4 p-6" onSubmit={(ev) => void onSubmit(ev)}>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              Course name
              <RequiredMark />
            </span>
            <input
              value={courseName}
              onChange={(e) => setCourseName(e.currentTarget.value)}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              Proposed date
              <RequiredMark />
            </span>
            <input
              type="date"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.currentTarget.value)}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
              {fileInputLabel}
              <RequiredMark />
            </span>
            <input
              key={rows.length}
              type="file"
              accept={fileAccept}
              onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-black/60">{fileHelp}</p>
          </label>

          <button type="submit" className="sk-button-primary" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
        </form>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-[#7A1F1F]">Your submissions</h2>
          {isLoading ? (
            <p className="mt-3 text-sm text-black/70">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="mt-3 text-sm text-black/70">No submissions yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {rows.map((r) => (
                <li key={r.id} className="rounded-xl border border-[#efe1db] bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#0001fc]">{r.course_name}</p>
                      <p className="text-sm text-black/70">Proposed date: {r.proposed_date}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-black/50">
                        Status:{" "}
                        <span
                          className={
                            r.status === "approved"
                              ? "text-green-700"
                              : r.status === "rejected"
                                ? "text-red-700"
                                : "text-amber-700"
                          }
                        >
                          {r.status}
                        </span>
                      </p>
                      {r.status === "rejected" && r.rejection_reason && (
                        <p className="mt-2 text-sm text-red-800">
                          <span className="font-semibold">Reason:</span> {r.rejection_reason}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="sk-button-secondary shrink-0 px-3 py-2 text-sm"
                      disabled={openingPath === r.file_storage_path}
                      onClick={() => void openFile(r.file_storage_path)}
                    >
                      {openingPath === r.file_storage_path ? "Opening…" : "View file"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
