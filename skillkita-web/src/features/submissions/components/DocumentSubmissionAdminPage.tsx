import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../../app/layout/DashboardLayout";
import { adminNavItems } from "../../../app/layout/navItems";
import { supabase } from "../../../shared/api/supabaseClient";
import { AdminPageFrame } from "../../../shared/ui/AdminPageFrame";
import { useViewer } from "../../../shared/hooks/useViewer";
import { listEmployerLabels } from "../../quotation/api/quotationRequestsApi";
import { adminReviewDocumentSubmission, listAllDocumentSubmissions } from "../submissionsApi";
import { getSubmissionFileSignedUrl } from "../submissionsStorage";
import type { DocumentSubmissionRow, DocumentSubmissionType } from "../types";
import { Jd14TemplatesAdminSection } from "./Jd14TemplatesAdminSection";

type EmployerLabel = {
  full_name: string;
  company_name: string | null;
  company_address: string | null;
};

type Props = {
  submissionType: DocumentSubmissionType;
  title: string;
  subtitle: string;
};

export function DocumentSubmissionAdminPage({ submissionType, title, subtitle }: Props) {
  const viewerState = useViewer();
  const [rows, setRows] = useState<DocumentSubmissionRow[]>([]);
  const [labels, setLabels] = useState<Record<string, EmployerLabel>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [active, setActive] = useState<DocumentSubmissionRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMessage(null);
    try {
      const list = await listAllDocumentSubmissions(submissionType);
      setRows(list);
      const ids = [...new Set(list.map((r) => r.employer_user_id))];
      const map = await listEmployerLabels(ids);
      setLabels(map);
    } catch (e) {
      setRows([]);
      setLabels({});
      setErrorMessage(e instanceof Error ? e.message : "Failed to load.");
    }
  }, [submissionType]);

  useEffect(() => {
    if (viewerState.kind === "signedIn") {
      setAdminEmail(viewerState.viewer.email);
      setAdminName(viewerState.viewer.fullName || "Admin");
    }
  }, [viewerState]);

  useEffect(() => {
    setIsLoading(true);
    void load().finally(() => setIsLoading(false));
  }, [load]);

  useEffect(() => {
    if (active) setRejectionReason("");
  }, [active]);

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

  const review = async (status: "approved" | "rejected") => {
    if (!active) return;
    if (status === "rejected" && !rejectionReason.trim()) {
      setErrorMessage("Please enter a reason when rejecting.");
      return;
    }
    setErrorMessage(null);
    setIsSaving(true);
    try {
      await adminReviewDocumentSubmission(active.id, {
        status,
        rejection_reason: status === "rejected" ? rejectionReason.trim() : null,
      });
      setActive(null);
      await load();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const pending = rows.filter((r) => r.status === "pending");
  const done = rows.filter((r) => r.status !== "pending");

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
        title={title}
        subtitle={subtitle}
        errorMessage={errorMessage}
        isAuthChecking={viewerState.kind === "loading"}
        isAuthorized={viewerState.kind === "signedIn"}
      >
        {submissionType === "jd14" && (
          <div className="mb-8">
            <Jd14TemplatesAdminSection />
          </div>
        )}
        {isLoading ? (
          <p className="text-sm text-ink-muted">Loading…</p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
            <div>
              <h2 className="text-lg font-bold text-primary">Pending</h2>
              {pending.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">No pending submissions.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {pending.map((r) => {
                    const lb = labels[r.employer_user_id];
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => setActive(r)}
                          className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                            active?.id === r.id
                              ? "border-primary bg-primary/5"
                              : "border-black/10 bg-white hover:bg-primary/5"
                          }`}
                        >
                          <p className="font-semibold text-ink">{r.course_name}</p>
                          <p className="text-xs text-ink-muted">
                            {lb?.full_name ?? r.employer_user_id}
                            {lb?.company_name ? ` · ${lb.company_name}` : ""}
                          </p>
                          <p className="text-xs text-ink-muted">Date: {r.proposed_date}</p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <h2 className="mt-8 text-lg font-bold text-primary">Reviewed</h2>
              {done.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">None yet.</p>
              ) : (
                <ul className="mt-3 max-h-80 space-y-2 overflow-auto">
                  {done.map((r) => {
                    const lb = labels[r.employer_user_id];
                    return (
                      <li
                        key={r.id}
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                      >
                        <span className="font-semibold text-ink">{r.course_name}</span>{" "}
                        <span className="text-ink-muted">· {r.status}</span>
                        <div className="text-xs text-ink-muted">
                          {lb?.full_name ?? r.employer_user_id} · {r.proposed_date}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="sk-card p-5">
              {!active ? (
                <p className="text-sm text-ink-muted">Select a pending submission to approve or reject.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-ink-muted">Employer</p>
                    <p className="font-semibold text-ink">
                      {labels[active.employer_user_id]?.full_name ?? active.employer_user_id}
                    </p>
                    {labels[active.employer_user_id]?.company_name && (
                      <p className="text-sm text-ink-muted">{labels[active.employer_user_id]?.company_name}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-ink-muted">Course</p>
                    <p className="text-sm">{active.course_name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-ink-muted">Proposed date</p>
                    <p className="text-sm">{active.proposed_date}</p>
                  </div>
                  <button
                    type="button"
                    className="sk-button-secondary w-full px-3 py-2 text-sm"
                    disabled={openingPath === active.file_storage_path}
                    onClick={() => void openFile(active.file_storage_path)}
                  >
                    {openingPath === active.file_storage_path ? "Opening…" : "View uploaded file"}
                  </button>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold text-primary">Rejection reason (required if reject)</span>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.currentTarget.value)}
                      rows={3}
                      className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
                      placeholder="Explain what needs to change…"
                      disabled={isSaving}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="sk-button-primary flex-1"
                      disabled={isSaving}
                      onClick={() => void review("approved")}
                    >
                      {isSaving ? "Saving…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      className="sk-button-secondary flex-1 border-red-200 text-red-800 hover:bg-red-50"
                      disabled={isSaving}
                      onClick={() => void review("rejected")}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AdminPageFrame>
    </DashboardLayout>
  );
}
