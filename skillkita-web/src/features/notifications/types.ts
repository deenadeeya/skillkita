export type NotificationKind =
  | "chat_message"
  | "quotation_request_new"
  | "quotation_request_reviewed"
  | "document_submission_new";

export type UserNotificationRow = {
  id: string;
  user_id: string;
  kind: NotificationKind;
  conversation_id: string | null;
  message_id: string | null;
  sender_user_id: string;
  employer_user_id: string | null;
  admin_user_id: string | null;
  quotation_request_id: string | null;
  document_submission_id: string | null;
  preview: string;
  created_at: string;
  read_at: string | null;
};
