import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { listEmployerLabels } from "../../features/quotation/api/quotationRequestsApi";
import { Jd14SubmissionReviewPanel } from "../../features/submissions/components/Jd14SubmissionReviewPanel";
import {
  confirmAdminDeleteDocumentSubmission,
  deleteDocumentSubmissionWithFile,
} from "../../features/submissions/adminDeleteDocumentSubmission";
import {
  adminReviewDocumentSubmission,
  getDocumentSubmissionById,
} from "../../features/submissions/submissionsApi";
import type { DocumentSubmissionRow } from "../../features/submissions/types";
import { supabase } from "../../shared/api/supabaseClient";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";
import { useViewer } from "../../shared/hooks/useViewer";

type EmployerLabel = {
  full_name: string;
  company_name: string | null;
  company_address: string | null;
};

const JD14_PAGE_TITLE = "JD14 Submission";
const JD14_PAGE_SUBTITLE =
  "Review employer JD14 PDFs. Approve or reject with a reason. Employers may send multiple pending submissions; review each row separately.";

const heroBackButtonClass =
  "inline-flex items-center rounded-xl border border-white/50 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20";

const AdminJd14ReviewRoute = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const viewerState = useViewer();

  const [submission, setSubmission] = useState<DocumentSubmissionRow | null>(null);
  const [employerLabel, setEmployerLabel] = useState<EmployerLabel | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setSubmission(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const row = await getDocumentSubmissionById(id);
      if (row && row.submission_type !== "jd14") {
        setSubmission(null);
        setEmployerLabel(null);
        setErrorMessage("This submission is not a JD14 document.");
        return;
      }

      setSubmission(row);
      if (row) {
        const labels = await listEmployerLabels([row.employer_user_id]);
        setEmployerLabel(labels[row.employer_user_id] ?? null);
      } else {
        setEmployerLabel(null);
      }
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to load JD14 submission.");
      setSubmission(null);
      setEmployerLabel(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (viewerState.kind === "signedIn") {
      setAdminEmail(viewerState.viewer.email);
      setAdminName(viewerState.viewer.displayName || "Admin");
    }
  }, [viewerState]);

  useEffect(() => {
    void load();
  }, [load]);

  const goBack = () => {
    navigate("/admin/jd14");
  };

  const handleDelete = async () => {
    if (!submission || !confirmAdminDeleteDocumentSubmission(submission)) return;

    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteDocumentSubmissionWithFile(submission.id);
      goBack();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not delete submission.");
    } finally {
      setIsDeleting(false);
    }
  };

  const review = async (status: "approved" | "rejected", rejectionReason: string | null) => {
    if (!submission) return;

    setIsSaving(true);
    setErrorMessage(null);
    try {
      await adminReviewDocumentSubmission(submission.id, {
        status,
        rejection_reason: status === "rejected" ? rejectionReason : null,
      });
      goBack();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Update failed.");
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
      <AdminPageFrame
        title={JD14_PAGE_TITLE}
        headerVariant="hero"
        subtitle={JD14_PAGE_SUBTITLE}
        errorMessage={errorMessage}
        isAuthChecking={viewerState.kind === "loading"}
        isAuthorized={viewerState.kind === "signedIn" && viewerState.viewer.role === "admin"}
        actions={
          <button type="button" onClick={goBack} className={heroBackButtonClass}>
            Back to JD14 list
          </button>
        }
      >
        {isLoading && <p className="text-sm text-ink-muted">Loading JD14 submission…</p>}

        {!isLoading && !submission && (
          <div className="sk-card p-6">
            <p className="text-sm text-ink-muted">JD14 submission not found.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={goBack} className="sk-button-secondary px-3 py-2">
                Back to JD14 list
              </button>
            </div>
          </div>
        )}

        {!isLoading && submission && (
          <Jd14SubmissionReviewPanel
            submission={submission}
            employerLabel={employerLabel}
            readOnly={submission.status !== "pending"}
            isSaving={isSaving}
            isDeleting={isDeleting}
            onApprove={() => void review("approved", null)}
            onReject={(reason) => void review("rejected", reason)}
            onDelete={() => void handleDelete()}
          />
        )}
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminJd14ReviewRoute;
