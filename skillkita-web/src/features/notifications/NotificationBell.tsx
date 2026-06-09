import { BellIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../shared/api/supabaseClient";
import type { Viewer } from "../../shared/hooks/useViewer";
import {
  markNotificationReadForRow,
  notificationCategoryLabel,
  notificationHref,
} from "./notificationDisplay";
import {
  fetchUserNotifications,
  markAllNotificationsRead,
  subscribeUserNotifications,
} from "./notificationsApi";
import type { UserNotificationRow } from "./types";

type Props = {
  viewer: Viewer;
};

function sortUnreadNotifications(rows: UserNotificationRow[]): UserNotificationRow[] {
  return rows
    .filter((row) => row.read_at == null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

const NotificationBell = ({ viewer }: Props) => {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<UserNotificationRow[]>([]);
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchUserNotifications();
      const unread = sortUnreadNotifications(list);
      setRows(unread);
      const senderIds = [...new Set(unread.map((r) => r.sender_user_id))];
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

  const unreadCount = useMemo(() => rows.length, [rows]);

  const senderLine = (row: UserNotificationRow) => {
    if (row.kind === "quotation_request_reviewed" && viewer.role === "employer") {
      return "SkillKita admin";
    }
    const name = nameByUserId[row.sender_user_id] ?? "User";
    return row.kind === "chat_message" ? `From ${name}` : name;
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setRows([]);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = (notification: UserNotificationRow) => {
    setRows((prev) => prev.filter((row) => row.id !== notification.id));
    setOpen(false);
    void markNotificationReadForRow(notification);
  };

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
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ring-2 ring-primary">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-[60] w-[min(100vw-2rem,22rem)] rounded-xl border border-black/10 bg-white p-2 text-primary shadow-xl ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-semibold text-primary underline hover:no-underline disabled:opacity-60"
                disabled={markingAll}
                onClick={() => void handleMarkAllRead()}
              >
                {markingAll ? "Marking…" : "Mark all as read"}
              </button>
            )}
          </div>
          {loading && <p className="px-2 py-4 text-sm text-ink-muted">Loading…</p>}
          {!loading && rows.length === 0 && (
            <p className="px-2 py-4 text-sm text-ink-muted">No new notifications.</p>
          )}
          {!loading && rows.length > 0 && (
            <ul className="max-h-[min(70vh,20rem)] overflow-auto">
              {rows.map((n) => {
                const href = notificationHref(n, viewer.role);
                const category = notificationCategoryLabel(n.kind);
                return (
                  <li key={n.id}>
                    <a
                      href={href}
                      className="block rounded-lg bg-primary/5 px-2 py-2.5 text-left hover:bg-paper"
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-ink">{category}</span>
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900">
                          Unread
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs font-semibold text-ink-muted">{senderLine(n)}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{n.preview}</p>
                      <p className="mt-1 text-[10px] text-ink-muted">
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
