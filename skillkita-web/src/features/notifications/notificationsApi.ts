import { supabase } from "../../shared/api/supabaseClient";
import type { UserNotificationRow } from "./types";

const CHAT_LIST_LIMIT = 40;

export async function fetchUserNotifications(): Promise<UserNotificationRow[]> {
  const { data, error } = await supabase
    .from("user_notifications")
    .select(
      "id,user_id,kind,conversation_id,message_id,sender_user_id,employer_user_id,admin_user_id,preview,created_at,read_at"
    )
    .order("created_at", { ascending: false })
    .limit(CHAT_LIST_LIMIT);

  if (error) throw error;
  return (data ?? []) as UserNotificationRow[];
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
