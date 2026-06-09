import type { NotificationKind } from "./types";
import {
  markDocumentSubmissionNotificationsRead,
  markDocumentSubmissionNotificationsReadByPreview,
  markNotificationsReadByKind,
  markQuotationNotificationsRead,
} from "./notificationsApi";

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

/** Mark quotation / document notifications read when the user opens the related page. */
export async function autoMarkNotificationsForLocation(
  pathname: string,
  search: string
): Promise<void> {
  const path = normalizePath(pathname);
  void search;

  const quotationReviewMatch = path.match(/^\/admin\/quotations\/review\/([^/]+)$/);
  if (quotationReviewMatch?.[1]) {
    await markQuotationNotificationsRead(quotationReviewMatch[1]);
    return;
  }

  if (path === "/admin/quotations") {
    await markNotificationsReadByKind(["quotation_request_new"]);
    return;
  }

  if (path === "/employer/quotation") {
    await markNotificationsReadByKind(["quotation_request_reviewed"]);
    return;
  }

  const jd14ReviewMatch = path.match(/^\/admin\/jd14\/review\/([^/]+)$/);
  if (jd14ReviewMatch?.[1]) {
    await markDocumentSubmissionNotificationsRead(jd14ReviewMatch[1]);
    return;
  }

  const receiptReviewMatch = path.match(/^\/admin\/payment-receipts\/review\/([^/]+)$/);
  if (receiptReviewMatch?.[1]) {
    await markDocumentSubmissionNotificationsRead(receiptReviewMatch[1]);
    return;
  }

  if (path === "/admin/jd14") {
    await markDocumentSubmissionNotificationsReadByPreview(false);
    return;
  }

  if (path === "/admin/payment-receipts") {
    await markDocumentSubmissionNotificationsReadByPreview(true);
  }
}

export const QUOTATION_NOTIFICATION_KINDS: NotificationKind[] = [
  "quotation_request_new",
  "quotation_request_reviewed",
];

export const DOCUMENT_NOTIFICATION_KINDS: NotificationKind[] = ["document_submission_new"];
