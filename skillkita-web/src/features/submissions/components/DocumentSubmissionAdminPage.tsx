import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../../app/layout/DashboardLayout";
import { adminNavItems } from "../../../app/layout/navItems";
import { AdminPageFrame } from "../../../shared/ui/AdminPageFrame";
import { useViewer } from "../../../shared/hooks/useViewer";
import { listEmployerLabels } from "../../quotation/api/quotationRequestsApi";
import {
  confirmAdminDeleteDocumentSubmission,
  deleteDocumentSubmissionWithFile,
} from "../adminDeleteDocumentSubmission";
import { listAllDocumentSubmissions } from "../submissionsApi";
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

function reviewHref(submissionType: DocumentSubmissionType, id: string): string {
  return submissionType === "jd14"
    ? `/admin/jd14/review/${id}`
    : `/admin/payment-receipts/review/${id}`;
}

function SubmissionListItem({
  row,
  label,
  submissionType,
  deletingId,
  onDelete,
}: {
  row: DocumentSubmissionRow;
  label: EmployerLabel | undefined;
  submissionType: DocumentSubmissionType;
  deletingId: string | null;
  onDelete: (row: DocumentSubmissionRow) => void;
}) {
  const isPending = row.status === "pending";
  const isDeleting = deletingId === row.id;

  return (
    <li className="flex flex-wrap items-stretch gap-2 rounded-xl border border-black/10 bg-white p-2 sm:flex-nowrap">
      <Link
        to={reviewHref(submissionType, row.id)}
        className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-primary/5"
      >
        <div className="min-w-0">
          <p className="font-semibold text-ink">{row.course_name}</p>
          <p className="text-xs text-ink-muted">
            {label?.full_name ?? row.employer_user_id}
            {label?.company_name ? ` · ${label.company_name}` : ""}
          </p>
          <p className="text-xs text-ink-muted">Date: {row.proposed_date}</p>
          {!isPending && (
            <p className="mt-1 text-xs capitalize text-ink-muted">Status: {row.status}</p>
          )}
        </div>
        <span className="shrink-0 text-sm font-semibold text-primary">
          {isPending ? "Review →" : "View →"}
        </span>
      </Link>
      {!isPending && (
        <button
          type="button"
          className="sk-button-secondary shrink-0 self-center border-red-200 px-3 py-2 text-sm text-red-800 hover:bg-red-50"
          disabled={Boolean(deletingId)}
          onClick={() => onDelete(row)}
        >
          {isDeleting ? "Deleting…" : "Delete"}
        </button>
      )}
    </li>
  );
}

export function DocumentSubmissionAdminPage({ submissionType, title, subtitle }: Props) {
  const viewerState = useViewer();
  const [rows, setRows] = useState<DocumentSubmissionRow[]>([]);
  const [labels, setLabels] = useState<Record<string, EmployerLabel>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
      setAdminName(viewerState.viewer.displayName || "Admin");
    }
  }, [viewerState]);

  useEffect(() => {
    setIsLoading(true);
    void load().finally(() => setIsLoading(false));
  }, [load]);

  const handleDelete = async (row: DocumentSubmissionRow) => {
    if (!confirmAdminDeleteDocumentSubmission(row)) return;

    setErrorMessage(null);
    setDeletingId(row.id);
    try {
      await deleteDocumentSubmissionWithFile(row.id);
      await load();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not delete submission.");
    } finally {
      setDeletingId(null);
    }
  };

  const pending = rows.filter((r) => r.status === "pending");
  const done = rows.filter((r) => r.status !== "pending");

  return (
    <DashboardLayout
      items={adminNavItems}
      userName={adminName}
      userEmail={adminEmail}
>
      <AdminPageFrame
        title={title}
        headerVariant="hero"
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
          <div className="max-w-3xl space-y-8">
            <section>
              <h2 className="text-lg font-bold text-primary">Pending</h2>
              {pending.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">No pending submissions.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {pending.map((r) => (
                    <SubmissionListItem
                      key={r.id}
                      row={r}
                      label={labels[r.employer_user_id]}
                      submissionType={submissionType}
                      deletingId={deletingId}
                      onDelete={(row) => void handleDelete(row)}
                    />
                  ))}
                </ul>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold text-primary">Reviewed</h2>
              {done.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">None yet.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {done.map((r) => (
                    <SubmissionListItem
                      key={r.id}
                      row={r}
                      label={labels[r.employer_user_id]}
                      submissionType={submissionType}
                      deletingId={deletingId}
                      onDelete={(row) => void handleDelete(row)}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </AdminPageFrame>
    </DashboardLayout>
  );
}
