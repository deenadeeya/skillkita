import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { employerNavItems } from "../../components/layout/navItems";
import ChatChannel from "../../features/chat/ChatChannel";
import type { ChatConversationRow } from "../../features/chat/types";
import { supabase } from "../../lib/supabaseClient";

type UserProfileRow = {
  user_id: string;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  full_name: string;
};

type AdminSummary = {
  user_id: string;
  full_name: string;
};

const EmployerChatRoom = () => {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ChatConversationRow | null>(null);
  const [admin, setAdmin] = useState<AdminSummary | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const conversationId = useMemo(() => {
    const id = new URLSearchParams(window.location.search).get("conversation");
    return id && id.length > 0 ? id : null;
  }, []);

  const inboxHref = useMemo(() => "/employer/messages", []);

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
        .select("user_id,role,status,full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError || !profileRow) {
        window.location.href = "/login";
        return;
      }

      const pr = profileRow as UserProfileRow;
      if (pr.role !== "employer" || pr.status !== "approved") {
        window.location.href = "/login";
        return;
      }

      setProfile(pr);

      if (!conversationId) {
        setConversation(null);
        setAdmin(null);
        setIsLoading(false);
        return;
      }

      const { data: convRow, error: convErr } = await supabase
        .from("chat_conversations")
        .select("id,employer_user_id,admin_user_id,created_at")
        .eq("id", conversationId)
        .maybeSingle();

      if (convErr) {
        setErrorMessage(convErr.message);
        setConversation(null);
        setAdmin(null);
        setIsLoading(false);
        return;
      }

      if (!convRow) {
        setConversation(null);
        setAdmin(null);
        setIsLoading(false);
        return;
      }

      const conv = convRow as ChatConversationRow;
      if (conv.employer_user_id !== user.id) {
        setConversation(null);
        setAdmin(null);
        setIsLoading(false);
        return;
      }

      setConversation(conv);

      const { data: adminRow, error: adminErr } = await supabase
        .from("user_profiles")
        .select("user_id,full_name")
        .eq("user_id", conv.admin_user_id)
        .maybeSingle();

      if (adminErr) {
        setErrorMessage(adminErr.message);
        setAdmin(null);
        setIsLoading(false);
        return;
      }

      setAdmin((adminRow ?? null) as AdminSummary | null);
      setIsLoading(false);
    };

    void load();
  }, [conversationId]);

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">Chat room</h1>
          <p className="mt-2 text-sm text-black/70">
            {admin?.full_name ? `Chatting with ${admin.full_name}.` : "Chatting with admin."}
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

      {isLoading ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
          Loading…
        </div>
      ) : !conversation || !profile ? (
        <div className="mt-6 sk-card p-6">
          <p className="text-sm text-black/70">Conversation not found.</p>
        </div>
      ) : (
        <div className="mt-6">
          <ChatChannel
            conversationId={conversation.id}
            currentUserId={profile.user_id}
            header={
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-[#7A1F1F]">Chatting with</p>
                <p className="text-xl font-bold text-[#0001fc]">{admin?.full_name ?? "Admin"}</p>
              </div>
            }
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default EmployerChatRoom;

