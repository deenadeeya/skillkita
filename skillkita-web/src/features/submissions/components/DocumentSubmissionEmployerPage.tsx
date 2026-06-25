import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../../app/layout/DashboardLayout";
import { employerNavItems } from "../../../app/layout/navItems";
import { useViewer } from "../../../shared/hooks/useViewer";
import { RequiredMark } from "../../../shared/ui/RequiredMark";
import { insertDocumentSubmission, listMyDocumentSubmissions } from "../submissionsApi";
import { getSubmissionFileSignedUrl, uploadEmployerSubmissionFile } from "../submissionsStorage";
import type { DocumentSubmissionRow, DocumentSubmissionType } from "../types";
import { DashboardPageHeader } from "../../../shared/ui/DashboardPageHeader";
import { Jd14TemplatesEmployerSection } from "./Jd14TemplatesEmployerSection";

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
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);

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

  const downloadFile = async (path: string) => {
    setDownloadingPath(path);
    setErrorMessage(null);
    try {
      const fileName = path.split("/").pop() ?? "submission";
      const url = await getSubmissionFileSignedUrl(path, 3600, { download: fileName });
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not download file.");
    } finally {
      setDownloadingPath(null);
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
    if (viewer.role !== "employer" || viewer.status === "rejected") {
      setErrorMessage("Employer account not available.");
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
      userName={viewerState.kind === "signedIn" ? viewerState.viewer.displayName : "Employer"}
      userEmail={viewerState.kind === "signedIn" ? viewerState.viewer.email : null}
>
      <div className="mx-auto w-full max-w-3xl">
        <DashboardPageHeader title={title} subtitle={subtitle} />

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{errorMessage}</div>
        )}

        {submissionType === "jd14" && <Jd14TemplatesEmployerSection />}

        <form className="sk-card mt-10 space-y-4 p-6 md:p-8" onSubmit={(ev) => void onSubmit(ev)}>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-primary">
              Course name
              <RequiredMark />
            </span>
            <input
              value={courseName}
              onChange={(e) => setCourseName(e.currentTarget.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-primary">
              Proposed date
              <RequiredMark />
            </span>
            <input
              type="date"
              value={proposedDate}
              onChange={(e) => setProposedDate(e.currentTarget.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
              required
              disabled={isSubmitting}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-primary">
              {fileInputLabel}
              <RequiredMark />
            </span>
            <input
              key={rows.length}
              type="file"
              accept={fileAccept}
              onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-ink-muted">{fileHelp}</p>
          </label>

          <button type="submit" className="sk-button-primary" disabled={isSubmitting || isLoading}>
            {isSubmitting ? "Submitting…" : "Submit"}
          </button>
        </form>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-primary">Your submissions</h2>
          {isLoading ? (
            <p className="mt-3 text-sm text-ink-muted">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="mt-3 text-sm text-ink-muted">No submissions yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {rows.map((r) => (
                <li key={r.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink">{r.course_name}</p>
                      <p className="text-sm text-ink-muted">Proposed date: {r.proposed_date}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-ink-muted">
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="sk-button-secondary shrink-0 px-3 py-2 text-sm"
                        disabled={openingPath === r.file_storage_path}
                        onClick={() => void openFile(r.file_storage_path)}
                      >
                        {openingPath === r.file_storage_path ? "Opening…" : "View file"}
                      </button>
                      <button
                        type="button"
                        className="sk-button-secondary shrink-0 px-3 py-2 text-sm"
                        disabled={downloadingPath === r.file_storage_path}
                        onClick={() => void downloadFile(r.file_storage_path)}
                      >
                        {downloadingPath === r.file_storage_path ? "Downloading…" : "Download"}
                      </button>
                    </div>
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
