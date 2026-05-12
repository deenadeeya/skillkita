import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../../app/layout/navItems";
import SiteHeader from "../../app/layout/SiteHeader";
import { supabase } from "../../shared/api/supabaseClient";
import {
  deleteExperience as deleteExperienceRow,
  insertExperience,
  listExperiences,
  updateExperience,
  type ExperienceRow,
} from "../../features/landing/api/landingApi";
import { uploadExperiencePhotos } from "../../features/landing/api/landingStorage";
import {
  ExperienceUpsertForm,
  type ExperienceFormState,
} from "../../features/landing/components/ExperienceUpsertForm";

const initialExperienceForm: ExperienceFormState = {
  name: "",
  date: "",
  details: "",
};

const CompanyExperience = () => {
  const [viewerRole, setViewerRole] = useState<"admin" | "employer" | null>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);

  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [experienceForm, setExperienceForm] =
    useState<ExperienceFormState>(initialExperienceForm);
  const [experienceFiles, setExperienceFiles] = useState<File[]>([]);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formNonce, setFormNonce] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadExperiences = useCallback(async () => {
    const rows = await listExperiences();
    setExperiences(rows);
  }, []);

  const editingExperience = useMemo(
    () => experiences.find((e) => e.id === editingExperienceId) ?? null,
    [editingExperienceId, experiences]
  );

  const formVisible = showAddForm || editingExperienceId !== null;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user ?? null;

        if (user) {
          setViewerEmail(user.email ?? null);
          const { data: profileRow } = await supabase
            .from("user_profiles")
            .select("role,status,full_name")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profileRow) {
            const r = profileRow as { role: "admin" | "employer"; status: string; full_name?: string };
            if (r.role === "admin") {
              setViewerRole("admin");
              setViewerName(r.full_name ?? "Admin");
            } else if (r.role === "employer" && r.status === "approved") {
              setViewerRole("employer");
              setViewerName(r.full_name ?? "Employer");
            } else {
              setViewerRole(null);
            }
          } else {
            setViewerRole(null);
          }
        } else {
          setViewerRole(null);
          setViewerEmail(null);
        }

        await loadExperiences();
        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        setErrorMessage(err instanceof Error ? err.message : "Failed to load experiences.");
      }
    };

    void load();
  }, [loadExperiences]);

  const resetExperienceForm = () => {
    setExperienceForm(initialExperienceForm);
    setExperienceFiles([]);
    setEditingExperienceId(null);
    setShowAddForm(false);
    setFormNonce((n) => n + 1);
  };

  const openAddExperience = () => {
    setShowAddForm(true);
    setEditingExperienceId(null);
    setExperienceForm(initialExperienceForm);
    setExperienceFiles([]);
    setFormNonce((n) => n + 1);
  };

  const onExperienceFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.currentTarget;
    setExperienceForm((prev) => ({ ...prev, [name]: value }));
  };

  const onExperiencePhotosChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    setExperienceFiles(files);
  };

  const uploadExperiencePhotosIfNeeded = async (): Promise<string[]> => {
    return await uploadExperiencePhotos(experienceFiles);
  };

  const startEditExperience = (exp: ExperienceRow) => {
    setShowAddForm(false);
    setEditingExperienceId(exp.id);
    setExperienceForm({ name: exp.name, date: exp.date, details: exp.details });
    setExperienceFiles([]);
    setFormNonce((n) => n + 1);
  };

  const deleteExperience = async (id: string) => {
    const wasEditingThis = editingExperienceId === id;
    setErrorMessage(null);
    setIsSaving(true);
    try {
      await deleteExperienceRow(id);
      await loadExperiences();
      if (wasEditingThis) resetExperienceForm();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to delete experience.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeExistingPhoto = async (photoUrl: string) => {
    if (!editingExperience) return;
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const next = (editingExperience.photo_urls ?? []).filter((u) => u !== photoUrl);
      await updateExperience(editingExperience.id, {
        name: editingExperience.name,
        date: editingExperience.date,
        details: editingExperience.details,
        photo_urls: next,
      });
      await loadExperiences();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to update photos.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveExperience = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!experienceForm.name.trim() || !experienceForm.date.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const newUrls = await uploadExperiencePhotosIfNeeded();

      if (editingExperienceId) {
        const existing = experiences.find((e) => e.id === editingExperienceId);
        const mergedUrls = [...(existing?.photo_urls ?? []), ...newUrls];

        await updateExperience(editingExperienceId, {
          name: experienceForm.name.trim(),
          date: experienceForm.date,
          details: experienceForm.details.trim(),
          photo_urls: mergedUrls,
        });
      } else {
        await insertExperience({
          name: experienceForm.name.trim(),
          date: experienceForm.date,
          details: experienceForm.details.trim(),
          photo_urls: newUrls,
        });
      }

      await loadExperiences();
      resetExperienceForm();
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save experience.");
    }
  };

  const showcaseGrid = (opts: { isAdmin: boolean }) => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {experiences.map((exp) => (
        <article key={exp.id} className="sk-card overflow-hidden p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-[#0001fc]">{exp.name}</h3>
              <p className="mt-1 text-sm font-semibold text-[#7A1F1F]">Date: {exp.date}</p>
            </div>
          </div>
          {exp.details?.trim() ? (
            <p className="mt-3 text-sm text-black">{exp.details}</p>
          ) : null}

          {(exp.photo_urls?.length ?? 0) > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {(exp.photo_urls ?? []).slice(0, 6).map((url) => (
                <img
                  key={url}
                  src={url}
                  alt={`${exp.name} photo`}
                  className="h-24 w-full rounded-xl object-cover ring-1 ring-black/5"
                  loading="lazy"
                />
              ))}
            </div>
          )}

          {opts.isAdmin && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[#efe1db] pt-4">
              <button
                type="button"
                onClick={() => startEditExperience(exp)}
                className="sk-button-secondary px-3 py-2"
                disabled={isSaving}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => void deleteExperience(exp.id)}
                className="sk-button-secondary border-red-200 px-3 py-2 text-red-800 hover:bg-red-50"
                disabled={isSaving}
              >
                Delete
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );

  const body = (
    <div className="w-full">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0001fc] md:text-5xl">
            Company Experience
          </h1>
          <p className="mt-2 text-sm font-semibold text-black/70 md:text-base">
            Activities and past experiences.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-left text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {viewerRole === "admin" && (
        <div className="mt-6 w-full max-w-6xl space-y-10">
          <section className="sk-card p-6">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">Add new experience</h2>
            <p className="mt-2 text-sm text-black/80">
              {editingExperienceId
                ? "You are editing an existing entry. Save to update the showcase, or cancel to close the form."
                : formVisible
                  ? "Fill in the details below. You can attach several photos at once."
                  : "Open the form to publish a new company experience."}
            </p>
            {!formVisible && (
              <button
                type="button"
                className="sk-button-primary mt-4"
                onClick={openAddExperience}
                disabled={isSaving}
              >
                Add New Experience
              </button>
            )}
            {formVisible && (
              <div className="mt-5">
                <ExperienceUpsertForm
                  formResetKey={formNonce}
                  experienceForm={experienceForm}
                  editingExperience={editingExperience}
                  isSaving={isSaving}
                  onFieldChange={onExperienceFieldChange}
                  onPhotosChange={onExperiencePhotosChange}
                  onRemoveExistingPhoto={(url) => void removeExistingPhoto(url)}
                  onSubmit={saveExperience}
                  onCancel={resetExperienceForm}
                />
              </div>
            )}
          </section>

          <section className="w-full text-left">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">Showcase</h2>
            <p className="mt-2 text-sm text-black/80">
              Preview of how each experience appears to visitors and employers.
            </p>

            {isLoading && (
              <p className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
                Loading content...
              </p>
            )}

            {!isLoading && experiences.length === 0 && (
              <p className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
                No experiences posted yet.
              </p>
            )}

            {!isLoading && experiences.length > 0 && <div className="mt-6">{showcaseGrid({ isAdmin: true })}</div>}
          </section>
        </div>
      )}

      {viewerRole !== "admin" && (
        <section className="mt-6 w-full max-w-6xl text-left md:mt-8">
          {isLoading && (
            <p className="rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
              Loading content...
            </p>
          )}

          {!isLoading && experiences.length === 0 && (
            <p className="rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
              No experiences posted yet.
            </p>
          )}

          {!isLoading && experiences.length > 0 && showcaseGrid({ isAdmin: false })}
        </section>
      )}
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      {viewerRole ? (
        <DashboardLayout
          showHeader
          items={viewerRole === "admin" ? adminNavItems : employerNavItems}
          userName={viewerName}
          userEmail={viewerEmail}
          onLogout={async () => {
            await supabase.auth.signOut();
            window.localStorage.removeItem("skillkita-role");
            window.location.href = "/";
          }}
        >
          {body}
        </DashboardLayout>
      ) : (
        <>
          <SiteHeader />
          <main className="sk-container py-10">{body}</main>
        </>
      )}
    </div>
  );
};

export default CompanyExperience;
