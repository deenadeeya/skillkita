import { BellIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../shared/api/supabaseClient";
import type { Viewer } from "../../shared/hooks/useViewer";
import {
  fetchUserNotifications,
  markChatNotificationsReadForConversation,
  subscribeUserNotifications,
} from "./notificationsApi";
import type { UserNotificationRow } from "./types";

type Props = {
  viewer: Viewer;
};

function sortNotifications(rows: UserNotificationRow[]): UserNotificationRow[] {
  return [...rows].sort((a, b) => {
    const aUnread = a.read_at == null;
    const bUnread = b.read_at == null;
    if (aUnread !== bUnread) return aUnread ? -1 : 1;
    const aT = new Date(aUnread ? a.created_at : (a.read_at ?? a.created_at)).getTime();
    const bT = new Date(bUnread ? b.created_at : (b.read_at ?? b.created_at)).getTime();
    return bT - aT;
  });
}

function chatHref(row: UserNotificationRow, role: Viewer["role"]): string {
  if (role === "admin") {
    return `/admin/messages?role=admin&conversation=${encodeURIComponent(row.conversation_id)}`;
  }
  return `/employer/talk-to-admin?admin=${encodeURIComponent(row.admin_user_id)}`;
}

const NotificationBell = ({ viewer }: Props) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<UserNotificationRow[]>([]);
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchUserNotifications();
      setRows(sortNotifications(list));
      const senderIds = [...new Set(list.map((r) => r.sender_user_id))];
      if (senderIds.length === 0) {
        setNameByUserId({});
        return;
      }
      const { data, error } = await supabase
        .from("user_profiles")
        .select("user_id,full_name")
        .in("user_id", senderIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data ?? []).forEach((raw) => {
        const row = raw as { user_id: string; full_name: string };
        map[row.user_id] = row.full_name?.trim() || "User";
      });
      setNameByUserId(map);
    } catch {
      setRows([]);
      setNameByUserId({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return subscribeUserNotifications(viewer.userId, () => {
      void load();
    });
  }, [load, viewer.userId]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const unreadCount = useMemo(() => rows.filter((r) => r.read_at == null).length, [rows]);

  const labelForSender = (senderId: string) => nameByUserId[senderId] ?? "User";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/25 bg-white/10 hover:bg-white/15"
      >
        <BellIcon className="h-6 w-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0001fc] px-1 text-[10px] font-bold text-white ring-2 ring-[#7A1F1F]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[60] w-[min(100vw-2rem,22rem)] rounded-xl border border-black/10 bg-white p-2 text-[#7A1F1F] shadow-xl ring-1 ring-black/5">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-black/50">Notifications</p>
          {loading && <p className="px-2 py-4 text-sm text-black/60">Loading…</p>}
          {!loading && rows.length === 0 && (
            <p className="px-2 py-4 text-sm text-black/60">No notifications yet.</p>
          )}
          {!loading && rows.length > 0 && (
            <ul className="max-h-[min(70vh,20rem)] overflow-auto">
              {rows.map((n) => {
                const unread = n.read_at == null;
                const href = chatHref(n, viewer.role);
                return (
                  <li key={n.id}>
                    <a
                      href={href}
                      className={[
                        "block rounded-lg px-2 py-2.5 text-left hover:bg-[#F5F1E8]",
                        unread ? "bg-[#faf7f2]" : "opacity-80",
                      ].join(" ")}
                      onClick={() => {
                        void markChatNotificationsReadForConversation(n.conversation_id);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-[#0001fc]">Chat</span>
                        <span
                          className={[
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            unread ? "bg-amber-100 text-amber-900" : "bg-black/10 text-black/60",
                          ].join(" ")}
                        >
                          {unread ? "Unread" : "Read"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-black/80">
                        From {labelForSender(n.sender_user_id)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-black/70">{n.preview}</p>
                      <p className="mt-1 text-[10px] text-black/45">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
