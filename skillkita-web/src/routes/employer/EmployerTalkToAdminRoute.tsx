import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { employerNavItems } from "../../app/layout/navItems";
import ChatChannel from "../../features/chat/ChatChannel";
import type { ChatConversationRow } from "../../features/chat/types";
import { getProfileDisplayName } from "../../features/profile/displayName";
import { supabase } from "../../shared/api/supabaseClient";
import { signOutAndRedirectHome } from "../../shared/auth/signOutAndRedirectHome";
import { DashboardPageHeader } from "../../shared/ui/DashboardPageHeader";

type UserProfileRow = {
  user_id: string;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  full_name: string;
  short_name: string | null;
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
  const [selectedAdmin, setSelectedAdmin] = useState<AdminListRow | null>(null);
  const [conversation, setConversation] = useState<ChatConversationRow | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedAdminId = useMemo(() => {
    const adminId = new URLSearchParams(window.location.search).get("admin");
    return adminId && adminId.length > 0 ? adminId : null;
  }, []);

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
        .select("user_id,role,status,full_name,short_name,company_name")
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
      if (row.status === "rejected") {
        window.location.href = "/login";
        return;
      }

      const { data: adminRows, error: adminErr } = await supabase
        .from("user_profiles")
        .select("user_id,full_name")
        .eq("role", "admin")
        .order("full_name", { ascending: true });

      if (adminErr) {
        setErrorMessage(adminErr.message);
        setAdmins([]);
        setIsLoading(false);
        return;
      }

      const adminList = (adminRows ?? []) as AdminListRow[];
      setAdmins(adminList);

      if (selectedAdminId) {
        const sel = adminList.find((a) => a.user_id === selectedAdminId) ?? null;
        setSelectedAdmin(sel);
        if (!sel) {
          setConversation(null);
          setIsLoading(false);
          return;
        }

        try {
          const conv = await ensureConversation(user.id, sel.user_id);
          setConversation(conv);
        } catch (e) {
          setErrorMessage(e instanceof Error ? e.message : "Could not open conversation.");
          setConversation(null);
        }
      } else {
        setSelectedAdmin(null);
        setConversation(null);
      }

      setIsLoading(false);
    };

    void load();
  }, [ensureConversation, selectedAdminId]);

  const backToPicker = () => {
    window.location.href = "/employer/talk-to-admin";
  };

  return (
    <DashboardLayout
      items={employerNavItems}
      userName={profile ? getProfileDisplayName(profile, "Employer") : "Employer"}
      userEmail={email}
      onLogout={() => {
        void signOutAndRedirectHome();
      }}
    >
        <DashboardPageHeader
          title="Talk to Admin"
          subtitle={
            profile
              ? `Hi ${getProfileDisplayName(profile, "Employer")}. Choose an admin and start a chat.`
              : "Choose an admin and start a chat."
          }
        />

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {isLoading && (
          <div className="mt-6 rounded-xl border border-dashed border-primary/20 bg-white/60 p-6 text-sm text-ink">
            Loading…
          </div>
        )}

        {!isLoading && !selectedAdmin && (
          <section className="sk-card mt-10 p-6">
            <h2 className="text-2xl font-bold text-primary">Choose an admin</h2>
            <p className="mt-2 text-sm text-ink-muted">
              You can message an admin about quotations, documents, or any support request.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {admins.map((a) => (
                <button
                  key={a.user_id}
                  type="button"
                  onClick={() => {
                    window.location.href = `/employer/talk-to-admin?admin=${encodeURIComponent(a.user_id)}`;
                  }}
                  className="rounded-xl border border-black/10 bg-white p-4 text-left shadow-sm hover:bg-primary/5"
                >
                  <p className="text-sm font-semibold text-ink">{a.full_name}</p>
                  <p className="mt-1 text-xs text-ink-muted">Click to open chat</p>
                </button>
              ))}
              {admins.length === 0 && (
                <div className="rounded-xl border border-dashed border-primary/20 bg-white/60 p-6 text-sm text-ink">
                  No admins found yet.
                </div>
              )}
            </div>
          </section>
        )}

        {!isLoading && selectedAdmin && conversation && (
          <div className="mt-8">
            <ChatChannel
              conversationId={conversation.id}
              currentUserId={profile!.user_id}
              header={
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-primary">Chatting with</p>
                    <p className="text-xl font-bold text-ink">{selectedAdmin.full_name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={backToPicker}
                    className="sk-button-secondary shrink-0 px-4 py-2"
                  >
                    Change admin
                  </button>
                </div>
              }
            />
          </div>
        )}
    </DashboardLayout>
  );
};

export default EmployerTalkToAdmin;

