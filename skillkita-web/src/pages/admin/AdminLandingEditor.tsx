import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import PlaceholderPoster from "../../assets/placeholder.jpg";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { adminNavItems } from "../../components/layout/navItems";
import { supabase } from "../../lib/supabaseClient";

type LandingContentRow = {
  id: number;
  cover_description: string;
  who_image_url: string | null;
  who_description: string;
  updated_at: string;
};

type ExperienceRow = {
  id: string;
  name: string;
  date: string;
  details: string;
  photo_urls: string[] | null;
  created_at: string;
};

type ExperienceFormState = {
  name: string;
  date: string;
  details: string;
};

const initialExperienceForm: ExperienceFormState = {
  name: "",
  date: "",
  details: "",
};

const AdminLandingEditor = () => {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const [landing, setLanding] = useState<LandingContentRow | null>(null);
  const [coverDescription, setCoverDescription] = useState("");
  const [whoDescription, setWhoDescription] = useState("");
  const [whoPreviewUrl, setWhoPreviewUrl] = useState<string>(PlaceholderPoster);
  const [whoFile, setWhoFile] = useState<File | null>(null);

  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [experienceForm, setExperienceForm] =
    useState<ExperienceFormState>(initialExperienceForm);
  const [experienceFiles, setExperienceFiles] = useState<File[]>([]);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      setIsAuthChecking(true);
      setErrorMessage(null);

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setIsAuthChecking(false);
        setIsAuthorized(false);
        setErrorMessage(error.message);
        return;
      }

      const user = data.session?.user;
      if (!user) {
        setIsAuthChecking(false);
        setIsAuthorized(false);
        window.location.href = "/login";
        return;
      }

      setAdminEmail(user.email ?? null);

      const { data: profileRow, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id,role,status,full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        setIsAuthChecking(false);
        setIsAuthorized(false);
        setErrorMessage(profileError.message);
        return;
      }

      if (!profileRow || profileRow.role !== "admin") {
        setIsAuthChecking(false);
        setIsAuthorized(false);
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/login";
        return;
      }

      window.localStorage.setItem("skillkita-role", "admin");
      setAdminName((profileRow as { full_name?: string }).full_name ?? "Admin");
      setIsAuthorized(true);
      setIsAuthChecking(false);
    };

    void checkAdmin();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void checkAdmin();
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  const editingExperience = useMemo(
    () => experiences.find((e) => e.id === editingExperienceId) ?? null,
    [editingExperienceId, experiences]
  );

  const loadLandingContent = useCallback(async () => {
    const { data, error } = await supabase
      .from("landing_content")
      .select("id,cover_description,who_image_url,who_description,updated_at")
      .eq("id", 1)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      setLanding(null);
      setCoverDescription("");
      setWhoDescription("");
      setWhoPreviewUrl(PlaceholderPoster);
      return;
    }

    const row = data as LandingContentRow;
    setLanding(row);
    setCoverDescription(row.cover_description ?? "");
    setWhoDescription(row.who_description ?? "");
    setWhoPreviewUrl(row.who_image_url ?? PlaceholderPoster);
  }, []);

  const loadExperiences = useCallback(async () => {
    const { data, error } = await supabase
      .from("experiences")
      .select("id,name,date,details,photo_urls,created_at")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    setExperiences((data ?? []) as ExperienceRow[]);
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await Promise.all([loadLandingContent(), loadExperiences()]);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to load content.");
    }
  }, [loadExperiences, loadLandingContent]);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }
    void loadAll();
  }, [isAuthorized, loadAll]);

  const onWhoImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) {
      setWhoFile(null);
      return;
    }
    setWhoFile(file);
    setWhoPreviewUrl(URL.createObjectURL(file));
  };

  const uploadWhoImageIfNeeded = async (): Promise<string | null> => {
    if (!whoFile) return null;

    const ext = (whoFile.name.split(".").pop() || "png")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const filePath = `who-are-we/${crypto.randomUUID()}.${ext || "png"}`;

    const { error: uploadError } = await supabase.storage
      .from("site-assets")
      .upload(filePath, whoFile, { upsert: false, contentType: whoFile.type });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("site-assets").getPublicUrl(filePath);
    return data.publicUrl ?? null;
  };

  const saveLanding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const whoUrl = await uploadWhoImageIfNeeded();

      const payload = {
        id: 1,
        cover_description: coverDescription.trim(),
        who_description: whoDescription.trim(),
        who_image_url: whoUrl ?? landing?.who_image_url ?? null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("landing_content").upsert(payload);
      if (error) throw new Error(error.message);

      setWhoFile(null);
      await loadLandingContent();
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save landing content.");
    }
  };

  const onExperienceFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.currentTarget;
    setExperienceForm((prev) => ({ ...prev, [name]: value }));
  };

  const onExperiencePhotosChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    setExperienceFiles(files);
  };

  const uploadExperiencePhotos = async (): Promise<string[]> => {
    if (experienceFiles.length === 0) return [];

    const urls: string[] = [];
    for (const file of experienceFiles) {
      const ext = (file.name.split(".").pop() || "jpg")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const filePath = `experiences/${crypto.randomUUID()}.${ext || "jpg"}`;

      const { error: uploadError } = await supabase.storage
        .from("experience-photos")
        .upload(filePath, file, { upsert: false, contentType: file.type });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage
        .from("experience-photos")
        .getPublicUrl(filePath);

      if (data.publicUrl) {
        urls.push(data.publicUrl);
      }
    }

    return urls;
  };

  const resetExperienceForm = () => {
    setExperienceForm(initialExperienceForm);
    setExperienceFiles([]);
    setEditingExperienceId(null);
  };

  const startEditExperience = (exp: ExperienceRow) => {
    setEditingExperienceId(exp.id);
    setExperienceForm({ name: exp.name, date: exp.date, details: exp.details });
    setExperienceFiles([]);
  };

  const deleteExperience = async (id: string) => {
    setErrorMessage(null);
    setIsSaving(true);

    const { error } = await supabase.from("experiences").delete().eq("id", id);
    if (error) {
      setIsSaving(false);
      setErrorMessage(error.message);
      return;
    }

    await loadExperiences();
    if (editingExperienceId === id) resetExperienceForm();
    setIsSaving(false);
  };

  const removeExistingPhoto = async (photoUrl: string) => {
    if (!editingExperience) return;
    setErrorMessage(null);
    setIsSaving(true);

    const next = (editingExperience.photo_urls ?? []).filter((u) => u !== photoUrl);
    const { error } = await supabase
      .from("experiences")
      .update({ photo_urls: next })
      .eq("id", editingExperience.id);

    if (error) {
      setIsSaving(false);
      setErrorMessage(error.message);
      return;
    }

    await loadExperiences();
    setIsSaving(false);
  };

  const saveExperience = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!experienceForm.name.trim() || !experienceForm.date.trim() || !experienceForm.details.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const newUrls = await uploadExperiencePhotos();

      if (editingExperienceId) {
        const existing = experiences.find((e) => e.id === editingExperienceId);
        const mergedUrls = [...(existing?.photo_urls ?? []), ...newUrls];

        const { error } = await supabase
          .from("experiences")
          .update({
            name: experienceForm.name.trim(),
            date: experienceForm.date,
            details: experienceForm.details.trim(),
            photo_urls: mergedUrls,
          })
          .eq("id", editingExperienceId);

        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("experiences").insert({
          name: experienceForm.name.trim(),
          date: experienceForm.date,
          details: experienceForm.details.trim(),
          photo_urls: newUrls,
        });

        if (error) throw new Error(error.message);
      }

      await loadExperiences();
      resetExperienceForm();
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save experience.");
    }
  };

  return (
    <DashboardLayout
      items={adminNavItems}
      userName={adminName}
      userEmail={adminEmail}
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">Manage Landing Page</h1>
          <p className="mt-3 text-lg text-black md:text-xl">
            Update cover text, who-are-we section, and manage experiences.
          </p>
        </div>
        <a href="/" className="sk-button-secondary w-fit">
          View site
        </a>
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isAuthChecking && (
        <div className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
          Checking admin access...
        </div>
      )}

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr,1.9fr]">
        <section className="sk-card p-6">
          <h2 className="text-2xl font-bold text-[#7A1F1F]">Cover</h2>
          <form className="mt-5 space-y-4" onSubmit={saveLanding}>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                Cover description
              </span>
              <textarea
                value={coverDescription}
                onChange={(e) => setCoverDescription(e.currentTarget.value)}
                rows={3}
                className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                placeholder="Offering HRD-Corp Levy Claimable Training Courses"
                required
              />
            </label>

            <h3 className="pt-2 text-xl font-bold text-[#7A1F1F]">Who are we</h3>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Picture</span>
              <input
                type="file"
                accept="image/*"
                onChange={onWhoImageChange}
                className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              />
              <img
                src={whoPreviewUrl}
                alt="Who are we preview"
                className="mt-3 w-full rounded-xl object-cover"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                Description
              </span>
              <textarea
                value={whoDescription}
                onChange={(e) => setWhoDescription(e.currentTarget.value)}
                rows={6}
                className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                placeholder="Write a short company introduction..."
                required
              />
            </label>

            <button type="submit" disabled={isSaving} className="sk-button-primary">
              {isSaving ? "Saving..." : "Save cover + who-are-we"}
            </button>
            {isLoading && (
              <p className="text-sm font-medium text-[#7A1F1F]">Loading...</p>
            )}
          </form>
        </section>

        <section className="sk-card p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">Experiences</h2>
            <p className="text-sm font-semibold text-[#7A1F1F]">{experiences.length} activities</p>
          </div>

          <form className="mt-5 space-y-4" onSubmit={saveExperience}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Activity name
                </span>
                <input
                  name="name"
                  value={experienceForm.name}
                  onChange={onExperienceFieldChange}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  placeholder="e.g. HR Workshop for SME"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Date</span>
                <input
                  type="date"
                  name="date"
                  value={experienceForm.date}
                  onChange={onExperienceFieldChange}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                Details
              </span>
              <textarea
                name="details"
                value={experienceForm.details}
                onChange={onExperienceFieldChange}
                rows={4}
                className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                placeholder="What happened? Who attended? Outcomes?"
                required
              />
            </label>

            {editingExperience?.photo_urls && editingExperience.photo_urls.length > 0 && (
              <div className="rounded-xl bg-[#f9f5ed] p-4">
                <p className="text-sm font-semibold text-[#7A1F1F]">
                  Existing photos (click remove)
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
                  {editingExperience.photo_urls.map((url) => (
                    <button
                      key={url}
                      type="button"
                      disabled={isSaving}
                      onClick={() => void removeExistingPhoto(url)}
                      className="group relative overflow-hidden rounded-xl ring-1 ring-black/5"
                      title="Remove photo"
                    >
                      <img
                        src={url}
                        alt="Experience"
                        className="h-28 w-full object-cover transition group-hover:opacity-80"
                      />
                      <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-sm font-semibold text-white group-hover:flex">
                        Remove
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                Add photos (multiple)
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={onExperiencePhotosChange}
                className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              />
              <p className="mt-2 text-xs text-black/70">Uploads will be added to the activity.</p>
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" disabled={isSaving} className="sk-button-primary">
                {isSaving ? "Saving..." : editingExperienceId ? "Update activity" : "Add activity"}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={resetExperienceForm}
                className="sk-button-secondary"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="mt-8 space-y-4">
            {isLoading && (
              <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                Loading experiences...
              </p>
            )}

            {experiences.map((exp) => (
              <article key={exp.id} className="rounded-xl border border-[#efe1db] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#0001fc]">{exp.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-[#7A1F1F]">Date: {exp.date}</p>
                    <p className="mt-2 text-sm text-black">{exp.details}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => startEditExperience(exp)}
                      className="sk-button bg-[#0001fc] px-3 py-2 text-white hover:bg-[#0001fc]/90"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void deleteExperience(exp.id)}
                      className="sk-button-primary px-3 py-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {(exp.photo_urls?.length ?? 0) > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {(exp.photo_urls ?? []).slice(0, 8).map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt={`${exp.name} photo`}
                        className="h-24 w-full rounded-xl object-cover ring-1 ring-black/5"
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}

            {!isLoading && experiences.length === 0 && (
              <p className="rounded-xl border border-dashed border-[#c5b5ad] p-6 text-sm text-black">
                No experiences yet. Add one above.
              </p>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default AdminLandingEditor;

