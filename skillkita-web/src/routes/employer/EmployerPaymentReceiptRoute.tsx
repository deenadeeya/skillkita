import { DocumentSubmissionEmployerPage } from "../../features/submissions/components/DocumentSubmissionEmployerPage";

const EmployerPaymentReceiptRoute = () => (
  <DocumentSubmissionEmployerPage
    submissionType="payment_receipt"
    title="Payment Receipt"
    subtitle="Upload a PDF or image of your payment receipt with the course name and proposed date. You can send multiple submissions anytime. An admin will approve or reject each one; if rejected, upload a new submission."
    fileInputLabel="Receipt (PDF or image)"
    fileAccept="application/pdf,image/*,.pdf,.png,.jpg,.jpeg,.webp,.gif"
    fileHelp="PDF or common image formats (PNG, JPG, WebP, GIF)."
  />
);

export default EmployerPaymentReceiptRoute;
