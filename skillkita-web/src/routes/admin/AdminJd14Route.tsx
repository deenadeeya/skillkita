import { DocumentSubmissionAdminPage } from "../../features/submissions/components/DocumentSubmissionAdminPage";

const AdminJd14Route = () => (
  <DocumentSubmissionAdminPage
    submissionType="jd14"
    title="JD14 Submission"
    subtitle="Review employer JD14 PDFs. Approve or reject with a reason. Employers may send multiple pending submissions; review each row separately."
  />
);

export default AdminJd14Route;
