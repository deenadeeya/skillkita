import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../shared/api/supabaseClient";
import { CHAT_ATTACHMENTS_BUCKET, createChatAttachmentSignedUrl, makeChatAttachmentPath } from "./chatStorage";
import type { ChatMessageRow } from "./types";

type Props = {
  conversationId: string;
  currentUserId: string;
  header?: React.ReactNode;
};

const ChatChannel = ({ conversationId, currentUserId, header }: Props) => {
  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const canSend = useMemo(() => {
    return (draft.trim().length > 0 || pendingFile) && !isSending;
  }, [draft, pendingFile, isSending]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("chat_messages")
      .select(
        "id,conversation_id,sender_user_id,body,created_at,chat_message_attachments(id,storage_path,file_name,mime_type,byte_size,created_at)"
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .order("created_at", { ascending: true, foreignTable: "chat_message_attachments" });

    if (error) {
      setMessages([]);
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setMessages((data ?? []) as ChatMessageRow[]);
    setIsLoading(false);
    setTimeout(scrollToBottom, 50);
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        () => {
          void loadMessages();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_message_attachments" },
        () => {
          void loadMessages();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, loadMessages]);

  const send = useCallback(async () => {
    if (!canSend) return;
    setIsSending(true);
    setErrorMessage(null);

    const body = draft.trim().length > 0 ? draft.trim() : null;
    const file = pendingFile;

    setDraft("");
    setPendingFile(null);

    const { data: msg, error: mErr } = await supabase
      .from("chat_messages")
      .insert({ conversation_id: conversationId, sender_user_id: currentUserId, body })
      .select("id")
      .single();

    if (mErr || !msg?.id) {
      setErrorMessage(mErr?.message ?? "Could not send message.");
      setIsSending(false);
      return;
    }

    if (file) {
      const storagePath = makeChatAttachmentPath(conversationId, msg.id, file.name);
      const { error: upErr } = await supabase.storage
        .from(CHAT_ATTACHMENTS_BUCKET)
        .upload(storagePath, file, { upsert: false, contentType: file.type || undefined });

      if (upErr) {
        setErrorMessage(`File upload failed: ${upErr.message}`);
        setIsSending(false);
        await loadMessages();
        return;
      }

      const { error: aErr } = await supabase.from("chat_message_attachments").insert({
        message_id: msg.id,
        uploader_user_id: currentUserId,
        storage_path: storagePath,
        file_name: file.name,
        mime_type: file.type || null,
        byte_size: file.size,
      });

      if (aErr) {
        setErrorMessage(`File metadata save failed: ${aErr.message}`);
        setIsSending(false);
        await loadMessages();
        return;
      }
    }

    setIsSending(false);
    await loadMessages();
  }, [canSend, conversationId, currentUserId, draft, loadMessages, pendingFile]);

  const openAttachment = async (path: string) => {
    setErrorMessage(null);
    try {
      const url = await createChatAttachmentSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not open attachment.");
    }
  };

  return (
    <section className="sk-card p-0">
      {header && <div className="border-b border-[#efe1db] p-5">{header}</div>}

      {errorMessage && (
        <div className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="px-5 pb-5 pt-4">
        {isLoading && <p className="text-sm text-black/70">Loading messages…</p>}

        {!isLoading && messages.length === 0 && (
          <p className="rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
            No messages yet. Send the first one.
          </p>
        )}

        <div className="mt-4 max-h-[55vh] space-y-3 overflow-auto pr-2">
          {messages.map((m) => {
            const mine = m.sender_user_id === currentUserId;
            const attachments = m.chat_message_attachments ?? [];
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={[
                    "max-w-[85%] rounded-2xl border px-4 py-3 text-sm shadow-sm",
                    mine
                      ? "border-[#0001fc]/20 bg-[#0001fc] text-white"
                      : "border-[#efe1db] bg-white text-black",
                  ].join(" ")}
                >
                  {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}

                  {attachments.length > 0 && (
                    <div className={m.body ? "mt-3" : ""}>
                      <p className={`text-xs font-semibold ${mine ? "text-white/90" : "text-black/70"}`}>
                        Attachment{attachments.length > 1 ? "s" : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {attachments.map((a) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => void openAttachment(a.storage_path)}
                            className={[
                              "rounded-lg border px-3 py-1.5 text-xs font-semibold",
                              mine
                                ? "border-white/30 bg-white/10 hover:bg-white/15"
                                : "border-[#7A1F1F] bg-[#f9f5ed] text-[#7A1F1F] hover:bg-[#f3ece1]",
                            ].join(" ")}
                          >
                            {a.file_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className={`mt-2 text-[11px] ${mine ? "text-white/70" : "text-black/50"}`}>
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="mt-5 rounded-xl border border-[#efe1db] bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex-1">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Message</span>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.currentTarget.value)}
                rows={3}
                placeholder="Type a message…"
                className="w-full resize-none rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 text-sm"
              />
            </label>

            <div className="flex flex-col gap-2 md:w-64">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">File (optional)</span>
                <input
                  type="file"
                  onChange={(e) => setPendingFile(e.currentTarget.files?.[0] ?? null)}
                  className="block w-full text-sm"
                />
              </label>

              {pendingFile && (
                <div className="rounded-lg border border-[#efe1db] bg-[#faf7f2] px-3 py-2 text-xs text-black">
                  Selected: <span className="font-semibold">{pendingFile.name}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => void send()}
                disabled={!canSend}
                className="sk-button-primary w-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
          <p className="mt-2 text-xs text-black/60">
            Files open via signed URLs (private storage). If you can’t open an attachment, check your Supabase
            storage bucket policies.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ChatChannel;

