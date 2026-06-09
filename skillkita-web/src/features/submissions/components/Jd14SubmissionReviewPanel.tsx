import { useState } from "react";
import type { DocumentSubmissionRow } from "../types";
import { SubmissionFilePreview } from "./SubmissionFilePreview";

type EmployerLabel = {
  full_name: string;
  company_name: string | null;
  company_address: string | null;
};

type Props = {
  submission: DocumentSubmissionRow;
  employerLabel: EmployerLabel | null;
  readOnly: boolean;
  isSaving: boolean;
  isDeleting?: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onDelete: () => void;
};

export function Jd14SubmissionReviewPanel({
  submission,
  employerLabel,
  readOnly,
  isSaving,
  isDeleting = false,
  onApprove,
  onReject,
  onDelete,
}: Props) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setActionError("Please enter a reason when rejecting.");
      return;
    }
    setActionError(null);
    onReject(rejectionReason.trim());
  };

  return (
    <section className="sk-card p-6">
      <h2 className="text-xl font-bold text-primary">
        {readOnly ? "JD14 submission" : "Review JD14 submission"}
      </h2>

      <p className="mt-3 text-sm text-ink-muted">
        {readOnly
          ? "View the submitted JD14 PDF below."
          : "Review the JD14 PDF below and confirm the course name and proposed training date match the employer’s entry before approving."}
      </p>

      <div className="mt-4 rounded-lg border border-black/10 bg-primary/5 p-4 text-sm">
        <p>
          <span className="font-semibold text-primary">Employer:</span>{" "}
          {employerLabel?.full_name ?? submission.employer_user_id}
          {employerLabel?.company_name ? ` (${employerLabel.company_name})` : ""}
        </p>
        {employerLabel?.company_address?.trim() ? (
          <p className="mt-1 whitespace-pre-wrap">
            <span className="font-semibold">Company address:</span> {employerLabel.company_address}
          </p>
        ) : null}
        <p className="mt-1">
          <span className="font-semibold">Course:</span> {submission.course_name}
        </p>
        <p className="mt-1">
          <span className="font-semibold">Proposed date:</span> {submission.proposed_date}
        </p>
        <p className="mt-1">
          <span className="font-semibold">Submitted:</span>{" "}
          {new Date(submission.created_at).toLocaleString()}
        </p>
        {readOnly && (
          <p className="mt-1">
            <span className="font-semibold">Status:</span>{" "}
            <span className="capitalize">{submission.status}</span>
            {submission.reviewed_at ? (
              <span className="text-ink-muted">
                {" "}
                · reviewed {new Date(submission.reviewed_at).toLocaleString()}
              </span>
            ) : null}
          </p>
        )}
        {readOnly && submission.status === "rejected" && submission.rejection_reason && (
          <p className="mt-2 text-red-800">
            <span className="font-semibold">Rejection reason:</span> {submission.rejection_reason}
          </p>
        )}
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">JD14 PDF preview</p>
        <SubmissionFilePreview storagePath={submission.file_storage_path} title="JD14 submission preview" />
      </div>

      {actionError && (
        <p className="mt-4 text-sm font-semibold text-red-700">{actionError}</p>
      )}

      {submission.status !== "pending" && (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-black/10 pt-6">
          <button
            type="button"
            className="sk-button-secondary border-red-200 px-3 py-2 text-sm text-red-800 hover:bg-red-50"
            disabled={isSaving || isDeleting}
            onClick={onDelete}
          >
            {isDeleting ? "Deleting…" : "Delete submission"}
          </button>
        </div>
      )}

      {!readOnly && (
        <>
          <label className="mt-6 block">
            <span className="mb-1 block text-sm font-semibold text-primary">
              Rejection reason (required if reject)
            </span>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.currentTarget.value)}
              rows={3}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm"
              placeholder="Explain what needs to change in the JD14…"
              disabled={isSaving}
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="sk-button-primary flex-1"
              disabled={isSaving}
              onClick={onApprove}
            >
              {isSaving ? "Saving…" : "Approve JD14"}
            </button>
            <button
              type="button"
              className="sk-button-secondary flex-1 border-red-200 text-red-800 hover:bg-red-50"
              disabled={isSaving}
              onClick={() => void handleReject()}
            >
              Reject
            </button>
          </div>
        </>
      )}
    </section>
  );
}
