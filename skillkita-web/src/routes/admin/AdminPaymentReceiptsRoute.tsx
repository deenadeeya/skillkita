import { DocumentSubmissionAdminPage } from "../../features/submissions/components/DocumentSubmissionAdminPage";

const AdminPaymentReceiptsRoute = () => (
  <DocumentSubmissionAdminPage
    submissionType="payment_receipt"
    title="Payment receipts"
    subtitle="Review employer payment receipts (PDF or image). Approve or reject with a reason. Multiple pending rows per employer are allowed."
  />
);

export default AdminPaymentReceiptsRoute;
