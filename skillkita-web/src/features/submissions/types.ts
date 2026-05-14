export type DocumentSubmissionType = "jd14" | "payment_receipt";

export type DocumentSubmissionStatus = "pending" | "approved" | "rejected";

export type DocumentSubmissionRow = {
  id: string;
  employer_user_id: string;
  submission_type: DocumentSubmissionType;
  course_name: string;
  proposed_date: string;
  file_storage_path: string;
  status: DocumentSubmissionStatus;
  rejection_reason: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};
