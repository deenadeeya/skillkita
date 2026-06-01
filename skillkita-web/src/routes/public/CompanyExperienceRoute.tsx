import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems, employerNavItems } from "../../app/layout/navItems";
import SiteHeader from "../../app/layout/SiteHeader";
import { normalizeSupabaseStorageUrl, supabase } from "../../shared/api/supabaseClient";
import { HomeCtaBanner } from "../../features/homepage/components/HomeCtaBanner";
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
import { ExperienceShowcaseCard } from "../../features/landing/components/ExperienceShowcaseCard";

const initialExperienceForm: ExperienceFormState = {
  name: "",
  date: "",
  details: "",
};

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h2 className="sk-heading-2 text-ink">{title}</h2>
      {subtitle ? <p className="mx-auto mt-3 max-w-2xl text-ink-muted">{subtitle}</p> : null}
    </div>
  );
}

const CompanyExperience = () => {
  const [viewerRole, setViewerRole] = useState<"admin" | "employer" | null>(null);
  const [viewerName, setViewerName] = useState<string>("User");
  const [viewerEmail, setViewerEmail] = useState<string | null>(null);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

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

  const isAdmin = viewerRole === "admin";

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
            .select("role,status,full_name,profile_pic_url")
            .eq("user_id", user.id)
            .maybeSingle();

          if (profileRow) {
            const r = profileRow as {
              role: "admin" | "employer";
              status: string;
              full_name?: string;
              profile_pic_url?: string | null;
            };
            setProfilePicUrl(normalizeSupabaseStorageUrl(r.profile_pic_url ?? null));
            if (r.role === "admin") {
              setViewerRole("admin");
              setViewerName(r.full_name ?? "Admin");
            } else if (r.role === "employer" && r.status !== "rejected") {
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
          setProfilePicUrl(null);
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
    setExperienceFiles(Array.from(event.currentTarget.files ?? []));
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const showcaseGrid = (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {experiences.map((exp) => (
        <ExperienceShowcaseCard
          key={exp.id}
          experience={exp}
          isAdmin={isAdmin}
          isSaving={isSaving}
          onEdit={() => startEditExperience(exp)}
          onDelete={() => void deleteExperience(exp.id)}
        />
      ))}
    </div>
  );

  const body = (
    <div className="w-full pb-8">
      <section className="rounded-hero bg-primary px-6 py-12 text-center sm:px-10 sm:py-14">
        <h1 className="sk-heading-1 text-white">Company Experience</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
          Training activities, industry collaboration, and milestones from Tawau Resources &amp; Skills
          Centre.
        </p>
      </section>

      {errorMessage && (
        <div className="mt-6 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isAdmin && (
        <section className="mx-auto mt-16 max-w-3xl sm:mt-20">
          <SectionHeader
            title="Manage experiences"
            subtitle="Add or update entries shown on this page and the About Us slideshow."
          />
          <article className="sk-card mt-8 p-6 md:p-8">
            {!formVisible && (
              <button
                type="button"
                className="sk-button-primary w-full sm:w-auto"
                onClick={openAddExperience}
                disabled={isSaving}
              >
                Add new experience
              </button>
            )}
            {formVisible && (
              <div>
                <p className="mb-4 text-sm text-ink-muted">
                  {editingExperienceId
                    ? "Update this entry and save to refresh the showcase."
                    : "Fill in the details and attach photos from your training activities."}
                </p>
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
          </article>
        </section>
      )}

      <section className="mt-16 sm:mt-20">
        <SectionHeader
          title="Experience showcase"
          subtitle={
            isAdmin
              ? "Preview of how each experience appears to visitors and employers."
              : "Snapshots from our workshops, assessments, and partnership programmes."
          }
        />

        {isLoading && (
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {[1, 2].map((n) => (
              <div key={n} className="sk-card h-80 animate-pulse bg-white/80" />
            ))}
          </div>
        )}

        {!isLoading && experiences.length === 0 && (
          <p className="mx-auto mt-10 max-w-3xl rounded-hero border border-dashed border-primary/20 bg-white p-10 text-center text-ink-muted">
            No experiences posted yet.
          </p>
        )}

        {!isLoading && experiences.length > 0 && <div className="mt-10">{showcaseGrid}</div>}
      </section>

      <HomeCtaBanner />
    </div>
  );

  const logout = async () => {
    await supabase.auth.signOut();
    window.localStorage.removeItem("skillkita-role");
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen w-full bg-paper">
      {viewerRole ? (
        <DashboardLayout
          showHeader
          fullWidth
          items={viewerRole === "admin" ? adminNavItems : employerNavItems}
          userName={viewerName}
          userRole={viewerRole}
          userEmail={viewerEmail}
          profilePicUrl={profilePicUrl}
          onLogout={logout}
        >
          {body}
        </DashboardLayout>
      ) : (
        <>
          <SiteHeader />
          <main className="sk-page-container">{body}</main>
        </>
      )}
    </div>
  );
};

export default CompanyExperience;
