import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import ChatChannel from "../../features/chat/ChatChannel";
import type { ChatConversationRow } from "../../features/chat/types";
import { supabase } from "../../shared/api/supabaseClient";

type ProfileRow = {
  user_id: string;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  full_name: string;
  company_name: string | null;
};

type EmployerSummary = {
  user_id: string;
  full_name: string;
  company_name: string | null;
};

const AdminMessages = () => {
  const [adminProfile, setAdminProfile] = useState<ProfileRow | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatConversationRow[]>([]);
  const [employerById, setEmployerById] = useState<Record<string, EmployerSummary>>({});

  const [selectedConversation, setSelectedConversation] = useState<ChatConversationRow | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedConversationId = useMemo(() => {
    const id = new URLSearchParams(window.location.search).get("conversation");
    return id && id.length > 0 ? id : null;
  }, []);

  const loadEmployers = useCallback(async (employerIds: string[]) => {
    if (employerIds.length === 0) {
      setEmployerById({});
      return;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("user_id,full_name,company_name")
      .in("user_id", employerIds);

    if (error) throw error;

    const map: Record<string, EmployerSummary> = {};
    (data ?? []).forEach((r: EmployerSummary) => {
      map[r.user_id] = r;
    });
    setEmployerById(map);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

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
      .select("user_id,role,status,full_name,company_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profileRow || profileRow.role !== "admin") {
      await supabase.auth.signOut();
      window.localStorage.removeItem("skillkita-role");
      window.location.href = "/login";
      return;
    }

    window.localStorage.setItem("skillkita-role", "admin");
    setAdminProfile(profileRow as ProfileRow);

    const { data: convRows, error: convErr } = await supabase
      .from("chat_conversations")
      .select("id,employer_user_id,admin_user_id,created_at")
      .eq("admin_user_id", user.id)
      .order("created_at", { ascending: false });

    if (convErr) throw convErr;

    const convList = (convRows ?? []) as ChatConversationRow[];
    setConversations(convList);

    const employerIds = [...new Set(convList.map((c) => c.employer_user_id))];
    await loadEmployers(employerIds);

    if (selectedConversationId) {
      setSelectedConversation(convList.find((c) => c.id === selectedConversationId) ?? null);
    } else {
      setSelectedConversation(null);
    }

    setIsLoading(false);
  }, [loadEmployers, selectedConversationId]);

  useEffect(() => {
    const run = async () => {
      setIsAuthChecking(true);
      try {
        await load();
      } catch (e) {
        setErrorMessage(e instanceof Error ? e.message : "Failed to load messages.");
        setIsLoading(false);
      } finally {
        setIsAuthChecking(false);
      }
    };

    void run();
  }, [load]);

  const openConversation = (id: string) => {
    window.location.href = `/admin/messages?role=admin&conversation=${encodeURIComponent(id)}`;
  };

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
        <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">Messages</h1>
        <p className="mt-3 text-lg text-black md:text-xl">
          {adminProfile ? `Welcome, ${adminProfile.full_name}.` : "Welcome."} Chat with employers here.
        </p>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {isAuthChecking && (
          <div className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
            Checking admin access…
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="sk-card p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold text-[#7A1F1F]">Inbox</h2>
              <span className="text-sm font-semibold text-[#7A1F1F]">{conversations.length}</span>
            </div>

            {isLoading && <p className="mt-4 text-sm text-black/70">Loading…</p>}

            {!isLoading && conversations.length === 0 && (
              <p className="mt-4 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
                No employer conversations yet.
              </p>
            )}

            <div className="mt-4 space-y-2">
              {conversations.map((c) => {
                const emp = employerById[c.employer_user_id];
                const active = selectedConversation?.id === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openConversation(c.id)}
                    className={[
                      "w-full rounded-xl border p-4 text-left shadow-sm",
                      active
                        ? "border-[#0001fc]/30 bg-[#0001fc]/5"
                        : "border-[#efe1db] bg-white hover:bg-[#faf7f2]",
                    ].join(" ")}
                  >
                    <p className="text-sm font-semibold text-[#0001fc]">{emp?.full_name ?? "Employer"}</p>
                    <p className="mt-1 text-xs text-black/60">
                      {emp?.company_name ? `Company: ${emp.company_name} · ` : ""}
                      Started: {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <div>
            {!selectedConversation && (
              <div className="sk-card p-6">
                <p className="text-sm text-black/70">Select a conversation to start chatting.</p>
              </div>
            )}

            {selectedConversation && adminProfile && (
              <ChatChannel
                conversationId={selectedConversation.id}
                currentUserId={adminProfile.user_id}
                header={
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-[#7A1F1F]">Chatting with</p>
                    <p className="text-xl font-bold text-[#0001fc]">
                      {employerById[selectedConversation.employer_user_id]?.full_name ?? "Employer"}
                    </p>
                  </div>
                }
              />
            )}
          </div>
        </div>
    </DashboardLayout>
  );
};

export default AdminMessages;

