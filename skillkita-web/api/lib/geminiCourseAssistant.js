const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_INSTRUCTION = `You are the SkillKita Course Assistant on the public website.
Audience: HR managers researching training for staff, and individuals looking for courses.

Rules:
- Answer only using COURSE_CATALOG and SITE_GUIDE in the user message. If unsure, say so and suggest Contact (/about-us).
- When recommending courses, name them and include markdown links: [Course Name](/courses/view?id=COURSE_ID) using exact ids from the catalog.
- Keep replies concise (under 200 words unless listing several courses).
- For quotations, private syllabus/HRD documents: explain employers must sign up and use /employer/quotation after login.
- Never give definitive HRD levy, tax, or legal compliance advice.
- Reply in the same language the user uses (Malay or English).`;

export async function callGeminiCourseAssistant({
  apiKey,
  userMessage,
  history,
  courseCatalogText,
  siteGuideText,
}) {
  const contextBlock = `SITE_GUIDE:\n${siteGuideText}\n\nCOURSE_CATALOG:\n${courseCatalogText}`;

  const contents = [];

  for (const turn of history) {
    if (!turn?.role || !turn?.content?.trim()) continue;
    const role = turn.role === "assistant" ? "model" : "user";
    contents.push({
      role,
      parts: [{ text: turn.content.trim() }],
    });
  }

  contents.push({
    role: "user",
    parts: [{ text: `${contextBlock}\n\nUser question:\n${userMessage.trim()}` }],
  });

  const body = {
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents,
    generationConfig: {
      temperature: 0.35,
      maxOutputTokens: 1024,
    },
  };

  const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      payload?.error?.message ||
      payload?.message ||
      `Gemini API error (${res.status})`;
    throw new Error(msg);
  }

  const reply =
    payload?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join("") ?? "";

  if (!reply.trim()) {
    throw new Error("Assistant returned an empty response.");
  }

  return reply.trim();
}
