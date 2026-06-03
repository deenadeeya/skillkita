export type AssistantTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function sendCourseAssistantMessage(
  message: string,
  history: AssistantTurn[]
): Promise<string> {
  const res = await fetch("/api/course-assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });

  const body = (await res.json().catch(() => ({}))) as { reply?: string; message?: string };
  if (!res.ok) {
    throw new Error(body.message || `Assistant unavailable (${res.status}).`);
  }
  if (!body.reply?.trim()) {
    throw new Error("Empty response from assistant.");
  }
  return body.reply.trim();
}
