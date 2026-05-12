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
  /** From user_profiles.email when migrated; may be null. */
  email: string | null;
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

    const primary = await supabase
      .from("user_profiles")
      .select("user_id,full_name,company_name,email")
      .in("user_id", employerIds);

    const missingEmailColumn =
      !!primary.error &&
      primary.error.message.toLowerCase().includes("email") &&
      primary.error.message.toLowerCase().includes("does not exist");

    const res = missingEmailColumn
      ? await supabase
          .from("user_profiles")
          .select("user_id,full_name,company_name")
          .in("user_id", employerIds)
      : primary;

    if (res.error) throw res.error;

    const map: Record<string, EmployerSummary> = {};
    (res.data ?? []).forEach((raw) => {
      const row = raw as {
        user_id: string;
        full_name: string;
        company_name: string | null;
        email?: string | null;
      };
      map[row.user_id] = {
        user_id: row.user_id,
        full_name: row.full_name,
        company_name: row.company_name ?? null,
        email: row.email != null && String(row.email).trim() ? String(row.email).trim() : null,
      };
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

  const backToInbox = () => {
    window.location.href = "/admin/messages?role=admin";
  };

  const inChatView = Boolean(selectedConversationId && selectedConversation && adminProfile);

  const activeEmployer = selectedConversation
    ? employerById[selectedConversation.employer_user_id]
    : undefined;

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
          <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">Messages</h1>
          <p className="mt-3 text-lg text-black md:text-xl">
            {adminProfile ? `Welcome, ${adminProfile.full_name}.` : "Welcome."}{" "}
            {inChatView
              ? "You’re in a chat with an employer."
              : "Pick a conversation from your inbox to reply."}
          </p>
        </div>
        {inChatView && (
          <button type="button" onClick={backToInbox} className="sk-button-secondary px-4 py-2">
            Back to inbox
          </button>
        )}
      </div>

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

      {!isAuthChecking && isLoading && (
        <div className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
          Loading…
        </div>
      )}

      {!isAuthChecking && !isLoading && !selectedConversationId && (
        <section className="sk-card mt-10 p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">Inbox</h2>
            <span className="text-sm font-semibold text-[#7A1F1F]">{conversations.length}</span>
          </div>
          <p className="mt-2 text-sm text-black/80">
            Choose a conversation to read and send messages.
          </p>

          {conversations.length === 0 && (
            <p className="mt-5 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
              No employer conversations yet.
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {conversations.map((c) => {
              const emp = employerById[c.employer_user_id];
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => openConversation(c.id)}
                  className="rounded-xl border border-[#efe1db] bg-white p-4 text-left shadow-sm hover:bg-[#faf7f2]"
                >
                  <p className="text-sm font-semibold text-[#0001fc]">
                    {emp?.full_name ?? "Employer"}
                    {emp?.email ? (
                      <span className="mt-0.5 block break-all text-xs font-normal text-black/70">
                        {emp.email}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-black/60">
                    {emp?.company_name ? `Company: ${emp.company_name} · ` : ""}
                    Started: {new Date(c.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#7A1F1F]">Click to open chat</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!isAuthChecking &&
        !isLoading &&
        selectedConversationId &&
        !selectedConversation && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            That conversation could not be found.{" "}
            <button type="button" className="font-semibold underline" onClick={backToInbox}>
              Return to inbox
            </button>
          </div>
        )}

      {!isAuthChecking && !isLoading && inChatView && selectedConversation && adminProfile && (
        <div className="mt-8">
          <ChatChannel
            conversationId={selectedConversation.id}
            currentUserId={adminProfile.user_id}
            header={
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-[#7A1F1F]">Chatting with</p>
                <p className="text-xl font-bold text-[#0001fc]">
                  <span className="inline">{activeEmployer?.full_name ?? "Employer"}</span>
                  {activeEmployer?.email ? (
                    <span className="mt-1 block break-all text-sm font-normal text-black/75 md:mt-0 md:inline md:before:mx-2 md:before:text-black/40 md:before:content-['·']">
                      {activeEmployer.email}
                    </span>
                  ) : null}
                </p>
              </div>
            }
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminMessages;

