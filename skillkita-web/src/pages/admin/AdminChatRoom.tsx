import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { adminNavItems } from "../../components/layout/navItems";
import ChatChannel from "../../features/chat/ChatChannel";
import type { ChatConversationRow } from "../../features/chat/types";
import { supabase } from "../../lib/supabaseClient";

type ProfileRow = {
  user_id: string;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  full_name: string;
};

type EmployerSummary = {
  user_id: string;
  full_name: string;
  company_name: string | null;
};

const AdminChatRoom = () => {
  const [adminProfile, setAdminProfile] = useState<ProfileRow | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ChatConversationRow | null>(null);
  const [employer, setEmployer] = useState<EmployerSummary | null>(null);

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const conversationId = useMemo(() => {
    const id = new URLSearchParams(window.location.search).get("conversation");
    return id && id.length > 0 ? id : null;
  }, []);

  const inboxHref = useMemo(() => "/admin/messages?role=admin", []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    if (!conversationId) {
      setConversation(null);
      setEmployer(null);
      setIsLoading(false);
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const user = sessionData.session?.user;
    if (!user) {
      window.location.href = "/login";
      return;
    }

    setAdminEmail(user.email ?? null);

    const { data: profileRow, error: profileError } = await supabase
      .from("user_profiles")
      .select("user_id,role,status,full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profileRow || (profileRow as ProfileRow).role !== "admin") {
      await supabase.auth.signOut();
      window.localStorage.removeItem("skillkita-role");
      window.location.href = "/login";
      return;
    }

    window.localStorage.setItem("skillkita-role", "admin");
    setAdminProfile(profileRow as ProfileRow);

    const { data: convRow, error: convErr } = await supabase
      .from("chat_conversations")
      .select("id,employer_user_id,admin_user_id,created_at")
      .eq("id", conversationId)
      .maybeSingle();

    if (convErr) throw convErr;
    if (!convRow) {
      setConversation(null);
      setEmployer(null);
      setIsLoading(false);
      return;
    }

    const conv = convRow as ChatConversationRow;
    if (conv.admin_user_id !== user.id) {
      setConversation(null);
      setEmployer(null);
      setIsLoading(false);
      return;
    }

    setConversation(conv);

    const { data: empRow, error: empErr } = await supabase
      .from("user_profiles")
      .select("user_id,full_name,company_name")
      .eq("user_id", conv.employer_user_id)
      .maybeSingle();

    if (empErr) throw empErr;
    setEmployer((empRow ?? null) as EmployerSummary | null);
    setIsLoading(false);
  }, [conversationId]);

  useEffect(() => {
    const run = async () => {
      setIsAuthChecking(true);
      try {
        await load();
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Failed to load chat room.");
        setIsLoading(false);
      } finally {
        setIsAuthChecking(false);
      }
    };
    void run();
  }, [load]);

  return (
    <DashboardLayout
      items={adminNavItems}
      userName={adminProfile?.full_name ?? "Admin"}
      userEmail={adminEmail}
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">Chat room</h1>
          <p className="mt-2 text-sm text-black/70">
            {employer?.full_name
              ? `Chatting with ${employer.full_name}${employer.company_name ? ` (${employer.company_name})` : ""}.`
              : "Chatting with employer."}
          </p>
        </div>
        <a href={inboxHref} className="sk-button-secondary px-4 py-2">
          ← Return to inbox
        </a>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isAuthChecking || isLoading ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
          Loading…
        </div>
      ) : !conversation || !adminProfile ? (
        <div className="mt-6 sk-card p-6">
          <p className="text-sm text-black/70">Conversation not found.</p>
        </div>
      ) : (
        <div className="mt-6">
          <ChatChannel
            conversationId={conversation.id}
            currentUserId={adminProfile.user_id}
            header={
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-[#7A1F1F]">Chatting with</p>
                <p className="text-xl font-bold text-[#0001fc]">{employer?.full_name ?? "Employer"}</p>
              </div>
            }
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminChatRoom;

