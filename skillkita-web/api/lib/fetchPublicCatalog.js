function requireSupabaseEnv() {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
  const anonKey = (process.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!supabaseUrl || !anonKey) {
    throw new Error("Server missing Supabase configuration.");
  }
  return { supabaseUrl, anonKey };
}

async function restGet(pathAndQuery) {
  const { supabaseUrl, anonKey } = requireSupabaseEnv();
  const res = await fetch(`${supabaseUrl}/rest/v1/${pathAndQuery}`, {
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Supabase request failed (${res.status}).`);
  }
  return res.json();
}

export async function fetchVisibleCoursesForAssistant() {
  const rows = await restGet(
    "courses?select=id,name,date,details,venue,trainer_names,course_time,price&is_visible=eq.true&order=date.asc.nullslast,created_at.desc&limit=80"
  );
  return Array.isArray(rows) ? rows : [];
}

export async function fetchLandingGuideForAssistant() {
  const rows = await restGet(
    "landing_content?select=location_description,company_hr_email,contact_1_name,contact_1_phone,contact_1_email,contact_2_name,contact_2_phone,contact_2_email&id=eq.1&limit=1"
  );
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export function formatCourseCatalog(courses) {
  if (!courses.length) return "(No public courses listed at the moment.)";
  return courses
    .map((c, i) => {
      const parts = [
        `${i + 1}. id=${c.id}`,
        `name=${JSON.stringify(c.name ?? "")}`,
        c.date ? `date=${c.date}` : null,
        c.venue ? `venue=${JSON.stringify(c.venue)}` : null,
        c.course_time ? `time=${JSON.stringify(c.course_time)}` : null,
        c.trainer_names ? `trainer=${JSON.stringify(c.trainer_names)}` : null,
        c.price ? `price=${JSON.stringify(c.price)}` : null,
      ].filter(Boolean);
      const detail = (c.details ?? "").replace(/\s+/g, " ").trim().slice(0, 180);
      if (detail) parts.push(`summary=${JSON.stringify(detail)}`);
      parts.push(`link=/courses/view?id=${c.id}`);
      return parts.join(" | ");
    })
    .join("\n");
}

export function formatSiteGuide(landing) {
  const lines = [
    "SkillKita (Tawau Resources & Skills Centre) — corporate training provider.",
    "Public pages: Home (/), Courses (/courses), About Us (/about-us), Company Experience (/company-experience).",
    "Individuals: browse courses, then Sign up (/signup) or Contact (/about-us).",
    "HR / companies: Sign up as employer (/signup), log in (/login), browse courses, request quotation (/employer/quotation after login), message admin from employer dashboard.",
    "Do not state HRD levy eligibility, claim approval, or guaranteed seats/prices — direct users to contact SkillKita.",
  ];
  if (landing?.location_description?.trim()) {
    lines.push(`Location: ${landing.location_description.trim().slice(0, 400)}`);
  }
  if (landing?.company_hr_email?.trim()) {
    lines.push(`Company email: ${landing.company_hr_email.trim()}`);
  }
  for (const n of [1, 2]) {
    const name = landing?.[`contact_${n}_name`]?.trim();
    const phone = landing?.[`contact_${n}_phone`]?.trim();
    const email = landing?.[`contact_${n}_email`]?.trim();
    if (name || phone || email) {
      lines.push(`Contact ${n}: ${[name, phone, email].filter(Boolean).join(", ")}`);
    }
  }
  return lines.join("\n");
}
