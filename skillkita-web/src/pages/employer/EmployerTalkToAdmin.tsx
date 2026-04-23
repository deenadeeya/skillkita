import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { employerNavItems } from "../../components/layout/navItems";
import type { ChatConversationRow } from "../../features/chat/types";
import { supabase } from "../../lib/supabaseClient";

type UserProfileRow = {
  user_id: string;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  full_name: string;
  company_name: string | null;
};

type AdminListRow = {
  user_id: string;
  full_name: string;
};

const EmployerTalkToAdmin = () => {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminListRow[]>([]);
  const [conversations, setConversations] = useState<ChatConversationRow[]>([]);
  const [adminById, setAdminById] = useState<Record<string, AdminListRow>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inboxHref = useMemo(() => "/employer/messages", []);

  const ensureConversation = useCallback(
    async (employerId: string, adminId: string) => {
      const { data: existing, error: sErr } = await supabase
        .from("chat_conversations")
        .select("id,employer_user_id,admin_user_id,created_at")
        .eq("employer_user_id", employerId)
        .eq("admin_user_id", adminId)
        .maybeSingle();

      if (sErr) throw sErr;
      if (existing) return existing as ChatConversationRow;

      const { data: created, error: iErr } = await supabase
        .from("chat_conversations")
        .insert({ employer_user_id: employerId, admin_user_id: adminId })
        .select("id,employer_user_id,admin_user_id,created_at")
        .single();

      if (iErr) throw iErr;
      return created as ChatConversationRow;
    },
    []
  );

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setErrorMessage(sessionError.message);
        setIsLoading(false);
        return;
      }

      const user = sessionData.session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? null);

      const { data: profileRow, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id,role,status,full_name,company_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(profileError.message);
        setIsLoading(false);
        return;
      }

      if (!profileRow) {
        window.location.href = "/login";
        return;
      }

      const row = profileRow as UserProfileRow;
      setProfile(row);

      if (row.role !== "employer") {
        window.location.href = "/";
        return;
      }
      if (row.status !== "approved") {
        window.location.href = "/login";
        return;
      }

      const [adminRes, convRes] = await Promise.all([
        supabase
          .from("user_profiles")
          .select("user_id,full_name")
          .eq("role", "admin")
          .order("full_name", { ascending: true }),
        supabase
          .from("chat_conversations")
          .select("id,employer_user_id,admin_user_id,created_at")
          .eq("employer_user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (adminRes.error) {
        setErrorMessage(adminRes.error.message);
        setAdmins([]);
        setConversations([]);
        setIsLoading(false);
        return;
      }

      if (convRes.error) {
        setErrorMessage(convRes.error.message);
        setAdmins([]);
        setConversations([]);
        setIsLoading(false);
        return;
      }

      const adminList = (adminRes.data ?? []) as AdminListRow[];
      setAdmins(adminList);
      const map: Record<string, AdminListRow> = {};
      adminList.forEach((a) => {
        map[a.user_id] = a;
      });
      setAdminById(map);

      setConversations((convRes.data ?? []) as ChatConversationRow[]);
      setIsLoading(false);
    };

    void load();
  }, [ensureConversation]);

  const openConversation = async (adminId: string) => {
    if (!profile) return;
    setErrorMessage(null);
    try {
      const conv = await ensureConversation(profile.user_id, adminId);
      window.location.href = `/employer/messages/chat?conversation=${encodeURIComponent(conv.id)}`;
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not open conversation.");
    }
  };

  const talkedToAdminIds = useMemo(() => {
    return new Set(conversations.map((c) => c.admin_user_id));
  }, [conversations]);

  const availableAdminsToStart = useMemo(() => {
    return admins.filter((a) => !talkedToAdminIds.has(a.user_id));
  }, [admins, talkedToAdminIds]);

  return (
    <DashboardLayout
      items={employerNavItems}
      userName={profile?.full_name ?? "Employer"}
      userEmail={email}
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
        <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">Messages</h1>
        <p className="mt-3 text-lg text-black md:text-xl">
          {profile ? `Hi ${profile.full_name}.` : "Hi."} Your inbox is below. Click a sender to open the chat room.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
            Loading…
          </div>
        )}

        {!isLoading && (
          <section className="sk-card mt-8 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-[#7A1F1F]">Inbox</h2>
              <span className="text-sm font-semibold text-[#7A1F1F]">{conversations.length}</span>
            </div>

            <div className="mt-4 space-y-2">
              {conversations.map((c) => {
                const a = adminById[c.admin_user_id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => void openConversation(c.admin_user_id)}
                    className="w-full rounded-xl border border-[#efe1db] bg-white p-4 text-left shadow-sm hover:bg-[#faf7f2]"
                  >
                    <p className="text-sm font-semibold text-[#0001fc]">{a?.full_name ?? "Admin"}</p>
                    <p className="mt-1 text-xs text-black/60">
                      Started: {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </button>
                );
              })}

              {conversations.length === 0 && (
                <p className="rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
                  No conversations yet. Start one below.
                </p>
              )}
            </div>

            <div className="mt-6 border-t border-black/5 pt-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-[#7A1F1F]">Start new chat</h3>
                <a href={inboxHref} className="text-xs font-semibold text-black/60 underline">
                  Refresh
                </a>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {availableAdminsToStart.map((a) => (
                  <button
                    key={a.user_id}
                    type="button"
                    onClick={() => void openConversation(a.user_id)}
                    className="rounded-xl border border-[#efe1db] bg-white p-4 text-left shadow-sm hover:bg-[#faf7f2]"
                  >
                    <p className="text-sm font-semibold text-[#0001fc]">{a.full_name}</p>
                    <p className="mt-1 text-xs text-black/60">Click to open chat</p>
                  </button>
                ))}

                {availableAdminsToStart.length === 0 && (
                  <div className="rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
                    No other admins available.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
    </DashboardLayout>
  );
};

export default EmployerTalkToAdmin;

