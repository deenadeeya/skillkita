import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import PlaceholderPoster from "../../assets/placeholder.jpg";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { supabase } from "../../shared/api/supabaseClient";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";
import { useViewer } from "../../shared/hooks/useViewer";
import {
  deleteExperience as deleteExperienceRow,
  getLandingContent,
  insertExperience,
  listExperiences,
  upsertLandingContent,
  updateExperience,
  type ExperienceRow,
  type LandingContentRow,
} from "../../features/landing/api/landingApi";
import {
  uploadExperiencePhotos,
  uploadSiteAssetWhoImage,
} from "../../features/landing/api/landingStorage";
import { LandingCoverEditor } from "../../features/landing/components/LandingCoverEditor";
import {
  ExperiencesEditor,
  type ExperienceFormState,
} from "../../features/landing/components/ExperiencesEditor";

const initialExperienceForm: ExperienceFormState = {
  name: "",
  date: "",
  details: "",
};

const AdminLandingEditor = () => {
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const viewerState = useViewer();

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
    if (viewerState.kind === "signedIn") {
      setAdminEmail(viewerState.viewer.email);
      setAdminName(viewerState.viewer.fullName || "Admin");
    }
  }, [viewerState]);

  const editingExperience = useMemo(
    () => experiences.find((e) => e.id === editingExperienceId) ?? null,
    [editingExperienceId, experiences]
  );

  const loadLandingContent = useCallback(async () => {
    const row = await getLandingContent(1);
    if (!row) {
      setLanding(null);
      setCoverDescription("");
      setWhoDescription("");
      setWhoPreviewUrl(PlaceholderPoster);
      return;
    }

    setLanding(row);
    setCoverDescription(row.cover_description ?? "");
    setWhoDescription(row.who_description ?? "");
    setWhoPreviewUrl(row.who_image_url ?? PlaceholderPoster);
  }, []);

  const loadExperiences = useCallback(async () => {
    const rows = await listExperiences();
    setExperiences(rows);
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await Promise.all([loadLandingContent(), loadExperiences()]);
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to load content."
      );
    }
  }, [loadExperiences, loadLandingContent]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

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
    return await uploadSiteAssetWhoImage(whoFile);
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

      await upsertLandingContent(payload);

      setWhoFile(null);
      await loadLandingContent();
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save landing content."
      );
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

  const uploadExperiencePhotosIfNeeded = async (): Promise<string[]> => {
    return await uploadExperiencePhotos(experienceFiles);
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
    try {
      await deleteExperienceRow(id);
      await loadExperiences();
      if (editingExperienceId === id) resetExperienceForm();
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

    if (
      !experienceForm.name.trim() ||
      !experienceForm.date.trim() ||
      !experienceForm.details.trim()
    ) {
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
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to save experience."
      );
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
      <AdminPageFrame
        title="Manage Landing Page"
        subtitle="Update cover text, who-are-we section, and manage experiences."
        errorMessage={errorMessage}
        isAuthChecking={viewerState.kind === "loading"}
        isAuthorized={viewerState.kind === "signedIn"}
        actions={
          <a href="/" className="sk-button-secondary w-fit">
            View site
          </a>
        }
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr,1.9fr]">
          <LandingCoverEditor
            coverDescription={coverDescription}
            whoDescription={whoDescription}
            whoPreviewUrl={whoPreviewUrl}
            isSaving={isSaving}
            onChangeCover={setCoverDescription}
            onChangeWhoDescription={setWhoDescription}
            onWhoImageChange={onWhoImageChange}
            onSubmit={saveLanding}
          />

          <ExperiencesEditor
            experiences={experiences}
            isLoading={isLoading}
            isSaving={isSaving}
            editingExperienceId={editingExperienceId}
            experienceForm={experienceForm}
            onFieldChange={onExperienceFieldChange}
            onPhotosChange={onExperiencePhotosChange}
            onStartEdit={startEditExperience}
            onCancelEdit={resetExperienceForm}
            onDelete={(id) => void deleteExperience(id)}
            onRemoveExistingPhoto={(url) => void removeExistingPhoto(url)}
            onSubmit={saveExperience}
          />
        </div>
      </AdminPageFrame>

    </DashboardLayout>
  );
};

export default AdminLandingEditor;

