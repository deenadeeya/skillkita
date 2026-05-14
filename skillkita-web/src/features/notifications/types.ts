export type UserNotificationRow = {
  id: string;
  user_id: string;
  kind: "chat_message";
  conversation_id: string;
  message_id: string;
  sender_user_id: string;
  employer_user_id: string;
  admin_user_id: string;
  preview: string;
  created_at: string;
  read_at: string | null;
};
