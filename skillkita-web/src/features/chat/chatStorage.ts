import { supabase } from "../../lib/supabaseClient";

export const CHAT_ATTACHMENTS_BUCKET = "chat-attachments" as const;

export async function createChatAttachmentSignedUrl(path: string, expiresInSeconds = 60 * 10) {
  const { data, error } = await supabase.storage
    .from(CHAT_ATTACHMENTS_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error) throw error;
  return data.signedUrl;
}

export function makeChatAttachmentPath(conversationId: string, messageId: string, fileName: string) {
  const safeName = fileName.replaceAll("/", "_").replaceAll("\\", "_");
  return `${conversationId}/${messageId}/${safeName}`;
}

