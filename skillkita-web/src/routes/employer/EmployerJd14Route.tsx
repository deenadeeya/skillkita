import { DocumentSubmissionEmployerPage } from "../../features/submissions/components/DocumentSubmissionEmployerPage";

const EmployerJd14Route = () => (
  <DocumentSubmissionEmployerPage
    submissionType="jd14"
    title="JD14 Submission"
    subtitle="Upload your JD14 PDF with the course name and proposed training date. You can send multiple submissions anytime. An admin will approve or reject each one; if rejected, you can submit a revised file as a new entry."
    fileInputLabel="JD14 (PDF)"
    fileAccept="application/pdf,.pdf"
    fileHelp="PDF only."
  />
);

export default EmployerJd14Route;
