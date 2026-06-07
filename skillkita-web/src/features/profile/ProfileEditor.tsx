import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../shared/api/supabaseClient";
import { hideImageOnError } from "../../shared/ui/hideImageOnError";
import { getProfileDisplayName, getProfileInitials } from "./displayName";
import { uploadProfilePic } from "./profilePicStorage";
import type { UserProfileRow } from "./types";

type Props = {
  expectedRole: "admin" | "employer";
};

const ProfileEditor = ({ expectedRole }: Props) => {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [shortName, setShortName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [phone, setPhone] = useState("");

  const [pendingPic, setPendingPic] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const canEditEmployerFields = expectedRole === "employer";
  const showEmail = expectedRole === "employer";
  const showCompany = expectedRole === "employer";
  const showPhone = expectedRole === "employer";

  const initials = useMemo(() => {
    if (!profile) return "—";
    return getProfileInitials(profile);
  }, [profile]);

  const displayName = useMemo(() => {
    if (!profile) return expectedRole === "admin" ? "Admin" : "Employer";
    return getProfileDisplayName(profile, expectedRole === "admin" ? "Admin" : "Employer");
  }, [profile, expectedRole]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData.session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? null);

      // Prefer reading company_address, but gracefully fall back if the DB
      // hasn't been migrated yet (otherwise the page can get stuck "Loading…").
      const primary = await supabase
        .from("user_profiles")
        .select("user_id,role,status,full_name,short_name,company_name,company_address,phone,profile_pic_url")
        .eq("user_id", user.id)
        .maybeSingle();

      const shouldFallback =
        !!primary.error &&
        primary.error.message.toLowerCase().includes("company_address") &&
        primary.error.message.toLowerCase().includes("does not exist");

      const res = shouldFallback
        ? await supabase
            .from("user_profiles")
            .select("user_id,role,status,full_name,short_name,company_name,phone,profile_pic_url")
            .eq("user_id", user.id)
            .maybeSingle()
        : primary;

      if (res.error) throw res.error;
      if (!res.data) {
        window.location.href = "/login";
        return;
      }

      const p = res.data as UserProfileRow;
      if (p.role !== expectedRole) {
        window.location.href = "/";
        return;
      }

      if (expectedRole === "admin") {
        window.localStorage.setItem("skillkita-role", "admin");
      }

      setProfile(p);
      setFullName(p.full_name ?? "");
      setShortName(p.short_name ?? "");
      setCompanyName(p.company_name ?? "");
      setCompanyAddress(p.company_address ?? "");
      setPhone(p.phone ?? "");
      setPendingPic(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not load profile.");
    } finally {
      setIsLoading(false);
    }
  }, [expectedRole]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let profilePicUrl = profile.profile_pic_url ?? null;
      if (pendingPic) {
        profilePicUrl = await uploadProfilePic(profile.user_id, pendingPic);
      }

      const update: Partial<UserProfileRow> = {
        full_name: fullName.trim() || "—",
        short_name: shortName.trim() ? shortName.trim() : null,
        profile_pic_url: profilePicUrl,
      };

      if (canEditEmployerFields) {
        update.company_name = companyName.trim() ? companyName.trim() : null;
        update.company_address = companyAddress.trim() ? companyAddress.trim() : null;
        update.phone = phone.trim() ? phone.trim() : null;
      }

      const primary = await supabase.from("user_profiles").update(update).eq("user_id", profile.user_id);
      const shouldFallback =
        !!primary.error &&
        primary.error.message.toLowerCase().includes("company_address") &&
        primary.error.message.toLowerCase().includes("does not exist");

      const res = shouldFallback
        ? await supabase
            .from("user_profiles")
            .update({
              ...update,
              // DB not migrated yet; omit field so other updates still work.
              company_address: undefined,
            })
            .eq("user_id", profile.user_id)
        : primary;

      if (res.error) throw res.error;

      setSuccessMessage(
        shouldFallback
          ? "Profile updated, but company address cannot be saved until the database is migrated."
          : "Profile updated."
      );
      await load();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not update profile.");
      setIsSaving(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="sk-card mt-8 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border border-black/10 bg-white shadow-sm">
            {profile?.profile_pic_url ? (
              <img src={profile.profile_pic_url} alt="Profile" className="h-full w-full object-cover" onError={hideImageOnError} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary">
                {initials}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-primary">{displayName}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Role: <span className="font-semibold capitalize">{expectedRole}</span>
            </p>
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-primary">Profile picture</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPendingPic(e.currentTarget.files?.[0] ?? null)}
            className="block w-full text-sm"
            disabled={isSaving}
          />
          {pendingPic && (
            <p className="mt-1 text-xs text-ink-muted">
              Selected: <span className="font-semibold">{pendingPic.name}</span>
            </p>
          )}
        </label>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          {successMessage}
        </div>
      )}

      {isLoading && (
        <div className="mt-6 rounded-xl border border-dashed border-primary/20 bg-white/60 p-6 text-sm text-ink">
          Loading…
        </div>
      )}

      {!isLoading && (
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={save}>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-sm font-semibold text-primary">Full name</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.currentTarget.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
              required
              disabled={isSaving}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-primary">Short name</span>
            <input
              value={shortName}
              onChange={(e) => setShortName(e.currentTarget.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
              placeholder="Optional (e.g. Aiman)"
              disabled={isSaving}
            />
          </label>

          {showEmail && (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-primary">Email</span>
              <input
                value={email ?? ""}
                readOnly
                className="w-full rounded-lg border border-black/10 bg-primary/5 px-3 py-2 text-ink-muted"
              />
              <p className="mt-1 text-xs text-ink-muted">Email is managed by Supabase Auth.</p>
            </label>
          )}

          {showCompany && (
            <>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-primary">
                  Company representing
                </span>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.currentTarget.value)}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
                  placeholder="Optional"
                  disabled={isSaving}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-primary">
                  Company address
                </span>
                <textarea
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.currentTarget.value)}
                  rows={3}
                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
                  placeholder="Optional"
                  disabled={isSaving}
                />
              </label>
            </>
          )}

          {showPhone && (
            <label className="block md:col-span-2">
              <span className="mb-1 block text-sm font-semibold text-primary">Phone number</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2"
                placeholder="Optional"
                disabled={isSaving}
              />
            </label>
          )}

          <div className="md:col-span-2">
            <button type="submit" className="sk-button-primary px-4 py-2" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default ProfileEditor;

