import { ChatBubbleLeftRightIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  sendCourseAssistantMessage,
  type AssistantTurn,
} from "../api/courseAssistantApi";
import { AssistantReplyText } from "./AssistantReplyText";

const STARTER_PROMPTS = [
  "What courses are available soon?",
  "How does a company request a quotation?",
  "I'm an individual — how do I sign up?",
] as const;

function isPublicAssistantRoute(pathname: string) {
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/employer")) return false;
  return true;
}

export function CourseAssistantWidget() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const visible = isPublicAssistantRoute(pathname);

  useEffect(() => {
    if (!open) return;
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, open, isLoading]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setInput("");
      const userTurn: AssistantTurn = { role: "user", content: trimmed };
      setTurns((prev) => [...prev, userTurn]);
      setIsLoading(true);

      try {
        const reply = await sendCourseAssistantMessage(trimmed, turns);
        setTurns((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Something went wrong.";
        setError(msg);
        setTurns((prev) => (prev[prev.length - 1]?.role === "user" ? prev.slice(0, -1) : prev));
        setInput(trimmed);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, turns]
  );

  if (!visible) return null;

  return (
    <>
      {open ? (
        <div
          className="fixed bottom-20 right-4 z-50 flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl sm:right-6 sm:w-[24rem]"
          role="dialog"
          aria-label="Course assistant"
        >
          <header className="flex items-center justify-between gap-2 border-b border-black/10 bg-primary px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">Course assistant</p>
              <p className="text-xs text-white/80">Find courses &amp; next steps</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 hover:bg-white/10"
              aria-label="Close assistant"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </header>

          <div ref={scrollRef} className="max-h-[min(50vh,320px)] flex-1 space-y-3 overflow-y-auto p-3">
            {turns.length === 0 && !isLoading ? (
              <div className="space-y-2 text-xs text-ink-muted">
                <p>
                  Ask about upcoming courses or how to register / request a quotation. Answers use
                  SkillKita&apos;s published course list only.
                </p>
                <div className="flex flex-col gap-1.5">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={isLoading}
                      onClick={() => void sendMessage(prompt)}
                      className="rounded-lg border border-black/10 bg-paper px-2.5 py-2 text-left text-xs font-medium text-primary hover:bg-primary/5"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {turns.map((turn, i) => (
              <div
                key={`${i}-${turn.role}`}
                className={
                  turn.role === "user"
                    ? "ml-6 rounded-xl bg-primary/10 px-3 py-2 text-sm text-ink"
                    : "mr-2 rounded-xl border border-black/5 bg-paper px-3 py-2"
                }
              >
                {turn.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{turn.content}</p>
                ) : (
                  <AssistantReplyText text={turn.content} />
                )}
              </div>
            ))}

            {isLoading ? (
              <p className="text-xs font-medium text-ink-muted" aria-live="polite">
                Thinking…
              </p>
            ) : null}

            {error ? (
              <p className="text-xs font-semibold text-red-700" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <form
            className="border-t border-black/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about courses…"
                disabled={isLoading}
                maxLength={800}
                className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
                aria-label="Message to course assistant"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="sk-button-secondary shrink-0 px-3 py-2 text-sm"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary/90 sm:right-6"
        aria-expanded={open}
        aria-label={open ? "Close course assistant" : "Open course assistant"}
      >
        {open ? (
          <XMarkIcon className="h-5 w-5" />
        ) : (
          <>
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Course assistant</span>
          </>
        )}
      </button>
    </>
  );
}
