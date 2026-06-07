export type ProfileNameFields = {
  full_name: string;
  short_name?: string | null;
};

export function getProfileDisplayName(
  profile: ProfileNameFields,
  fallback = "User"
): string {
  const short = profile.short_name?.trim();
  if (short) return short;
  const full = profile.full_name?.trim();
  if (full && full !== "—") return full;
  return fallback;
}

export function getProfileInitials(profile: ProfileNameFields): string {
  const base = getProfileDisplayName(profile, "—");
  const parts = base.split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "—";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (a + b).toUpperCase();
}
