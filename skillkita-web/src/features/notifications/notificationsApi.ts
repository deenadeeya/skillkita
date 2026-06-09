import { supabase } from "../../shared/api/supabaseClient";
import type { UserNotificationRow } from "./types";

const NOTIFICATION_LIST_LIMIT = 50;

const NOTIFICATION_SELECT =
  "id,user_id,kind,conversation_id,message_id,sender_user_id,employer_user_id,admin_user_id,quotation_request_id,document_submission_id,preview,created_at,read_at";

export async function fetchUserNotifications(): Promise<UserNotificationRow[]> {
  const { data, error } = await supabase
    .from("user_notifications")
    .select(NOTIFICATION_SELECT)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_LIST_LIMIT);

  if (error) throw error;
  return (data ?? []) as UserNotificationRow[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: now })
    .eq("id", notificationId)
    .is("read_at", null);

  if (error) {
    console.warn("markNotificationRead:", error.message);
  }
}

export async function markChatNotificationsReadForConversation(conversationId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: now })
    .eq("conversation_id", conversationId)
    .is("read_at", null);

  if (error) {
    console.warn("markChatNotificationsReadForConversation:", error.message);
  }
}

export async function markQuotationNotificationsRead(quotationRequestId: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: now })
    .eq("quotation_request_id", quotationRequestId)
    .is("read_at", null);

  if (error) {
    console.warn("markQuotationNotificationsRead:", error.message);
  }
}

export async function markDocumentSubmissionNotificationsRead(
  documentSubmissionId: string
): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: now })
    .eq("document_submission_id", documentSubmissionId)
    .is("read_at", null);

  if (error) {
    console.warn("markDocumentSubmissionNotificationsRead:", error.message);
  }
}

export async function markNotificationsReadByKind(kinds: UserNotificationRow["kind"][]): Promise<void> {
  if (kinds.length === 0) return;

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: now })
    .in("kind", kinds)
    .is("read_at", null);

  if (error) {
    console.warn("markNotificationsReadByKind:", error.message);
  }
}

export async function markDocumentSubmissionNotificationsReadByPreview(
  paymentReceipt: boolean
): Promise<void> {
  const now = new Date().toISOString();
  let query = supabase
    .from("user_notifications")
    .update({ read_at: now })
    .eq("kind", "document_submission_new")
    .is("read_at", null);

  query = paymentReceipt
    ? query.ilike("preview", "%payment receipt%")
    : query.not("preview", "ilike", "%payment receipt%");

  const { error } = await query;
  if (error) {
    console.warn("markDocumentSubmissionNotificationsReadByPreview:", error.message);
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: now })
    .is("read_at", null);

  if (error) {
    console.warn("markAllNotificationsRead:", error.message);
  }
}

export function subscribeUserNotifications(userId: string, onChange: () => void) {
  // Unique topic per subscription: Supabase reuses `channel(name)` instances. React Strict Mode
  // mounts → unmount → remount; a fixed name can return an already-subscribed channel, and then
  // `.on()` runs after `subscribe()` → "cannot add postgres_changes callbacks ... after subscribe()".
  const topic = `user_notifications:${userId}:${crypto.randomUUID()}`;
  const channel = supabase.channel(topic);
  channel.on(
    "postgres_changes",
    { event: "*", schema: "public", table: "user_notifications", filter: `user_id=eq.${userId}` },
    () => {
      onChange();
    }
  );
  channel.subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
