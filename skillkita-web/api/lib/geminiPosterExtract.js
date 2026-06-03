const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const POSTER_FIELD_KEYS = [
  "name",
  "date",
  "trainerNames",
  "time",
  "venue",
  "mycoid",
  "price",
  "contactPerson",
  "contactPhone",
  "syllabus",
  "details",
];

const EXTRACTION_PROMPT = `You extract structured course information from a training course poster image (Malaysia; Malay and/or English).

Return ONLY valid JSON with exactly these string keys (use "" if unknown):
name, date, trainerNames, time, venue, mycoid, price, contactPerson, contactPhone, syllabus, details

Rules:
- name: official course title only (not company name or tagline unless that is the only title)
- date: ISO YYYY-MM-DD for the primary start date; if a range, use the first day
- trainerNames: trainer/instructor/jurulatih names
- time: schedule text as shown (e.g. "9:00 AM - 5:00 PM")
- venue: location/venue/tempat/lokasi
- mycoid: MyCOID registration if shown
- price: fee as shown (e.g. "RM 500")
- contactPerson: person to contact
- contactPhone: phone number
- syllabus: course content/modules/kandungan if listed briefly
- details: 2-4 sentence summary of other important poster facts not covered above

Do not invent data. Empty string for missing fields.`;

export function parseGeminiJsonText(raw) {
  const trimmed = String(raw ?? "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();
  return JSON.parse(candidate);
}

export function normalizePosterExtraction(raw) {
  const out = {};
  for (const key of POSTER_FIELD_KEYS) {
    const v = raw?.[key];
    out[key] = typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
  }
  if (out.date && !/^\d{4}-\d{2}-\d{2}$/.test(out.date)) {
    out.date = "";
  }
  return out;
}

export async function callGeminiPosterExtract({ apiKey, mimeType, base64 }) {
  const body = {
    contents: [
      {
        parts: [
          { text: EXTRACTION_PROMPT },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
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

  const text =
    payload?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join("") ?? "";

  if (!text.trim()) {
    throw new Error("Gemini returned an empty response.");
  }

  let parsed;
  try {
    parsed = parseGeminiJsonText(text);
  } catch {
    throw new Error("Could not parse structured data from the poster.");
  }

  return normalizePosterExtraction(parsed);
}
