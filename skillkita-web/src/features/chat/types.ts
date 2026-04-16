export type ChatConversationRow = {
  id: string;
  employer_user_id: string;
  admin_user_id: string;
  created_at: string;
};

export type ChatMessageAttachmentRow = {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  byte_size: number | null;
  created_at: string;
};

export type ChatMessageRow = {
  id: string;
  conversation_id: string;
  sender_user_id: string;
  body: string | null;
  created_at: string;
  chat_message_attachments?: ChatMessageAttachmentRow[] | null;
};

