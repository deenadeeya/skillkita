import type { Viewer } from "../../shared/hooks/useViewer";
import {
  markChatNotificationsReadForConversation,
  markDocumentSubmissionNotificationsRead,
  markNotificationRead,
  markQuotationNotificationsRead,
} from "./notificationsApi";
import type { NotificationKind, UserNotificationRow } from "./types";

export function notificationCategoryLabel(kind: NotificationKind): string {
  switch (kind) {
    case "chat_message":
      return "Chat";
    case "quotation_request_new":
    case "quotation_request_reviewed":
      return "Quotation";
    case "document_submission_new":
      return "Document";
    default:
      return "Notification";
  }
}

export function notificationHref(row: UserNotificationRow, role: Viewer["role"]): string {
  if (row.kind === "chat_message" && row.conversation_id) {
    if (role === "admin") {
      return `/admin/messages?role=admin&conversation=${encodeURIComponent(row.conversation_id)}`;
    }
    if (row.admin_user_id) {
      return `/employer/talk-to-admin?admin=${encodeURIComponent(row.admin_user_id)}`;
    }
    return "/employer/talk-to-admin";
  }

  if (row.kind === "quotation_request_new" || row.kind === "quotation_request_reviewed") {
    return role === "admin" ? "/admin/quotations" : "/employer/quotation";
  }

  if (row.kind === "document_submission_new") {
    const preview = row.preview.toLowerCase();
    if (role === "admin") {
      return preview.includes("payment receipt") ? "/admin/payment-receipts" : "/admin/jd14";
    }
    return preview.includes("payment receipt") ? "/employer/payment-receipt" : "/employer/jd14";
  }

  return role === "admin" ? "/admin" : "/employer";
}

export async function markNotificationReadForRow(row: UserNotificationRow): Promise<void> {
  if (row.kind === "chat_message" && row.conversation_id) {
    await markChatNotificationsReadForConversation(row.conversation_id);
    return;
  }
  if (row.quotation_request_id) {
    await markQuotationNotificationsRead(row.quotation_request_id);
    return;
  }
  if (row.document_submission_id) {
    await markDocumentSubmissionNotificationsRead(row.document_submission_id);
    return;
  }
  await markNotificationRead(row.id);
}
