import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import {
  COURSE_PRIVATE_BUCKET,
  PRIVATE_DOC_LABELS,
  columnForKind,
  createSignedUrlForPath,
  uploadCoursePrivateFile,
  type PrivateDocKind,
} from "../../features/courses/storage/coursePrivateStorage";
import { getStoragePublicUrl, supabase } from "../../shared/api/supabaseClient";
import { extractPosterFieldsFromImage } from "../../features/courses/api/extractPosterApi";
import { mergePosterExtractionIntoForm } from "../../features/courses/utils/applyPosterExtraction";
import { posterFileToExtractPayload } from "../../features/courses/utils/posterImageForExtract";
import { isImagePoster, isPdfPoster, type OcrState } from "./OCRCourses";
import { CoursePosterOcrPanel } from "../../features/courses/components/admin/CoursePosterOcrPanel";
import { CoursePrivateDocumentsPicker } from "../../features/courses/components/admin/CoursePrivateDocumentsPicker";
import { CourseDetailsForm } from "../../features/courses/components/admin/CourseDetailsForm";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";

type CoursePrivatePaths = {
  syllabus_storage_path: string | null;
  tentative_storage_path: string | null;
  trainer_hrd_storage_path: string | null;
  trainer_cv_storage_path: string | null;
};

type CourseRow = {
  id: string;
  name: string;
  date: string | null;
  details: string;
  trainer_names: string | null;
  course_time: string | null;
  venue: string | null;
  mycoid: string | null;
  price: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  syllabus: string | null;
  poster_url: string | null;
  is_visible: boolean;
  created_at: string;
  course_private_files: CoursePrivatePaths | CoursePrivatePaths[] | null;
};

type CourseFormState = {
  name: string;
  date: string;
  trainerNames: string;
  time: string;
  venue: string;
  mycoid: string;
  price: string;
  contactPerson: string;
  contactPhone: string;
  syllabus: string;
  details: string;
  isVisible: boolean;
};

const initialFormState: CourseFormState = {
  name: "",
  date: "",
  trainerNames: "",
  time: "",
  venue: "",
  mycoid: "",
  price: "",
  contactPerson: "",
  contactPhone: "",
  syllabus: "",
  details: "",
  isVisible: true,
};

const emptyPrivateSelections: Record<PrivateDocKind, File | null> = {
  syllabus: null,
  tentative: null,
  trainer_hrd: null,
  trainer_cv: null,
};

function normalizePrivateFiles(raw: CourseRow["course_private_files"]): CoursePrivatePaths | null {
  if (!raw) return null;
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row) return null;
  return {
    syllabus_storage_path: row.syllabus_storage_path ?? null,
    tentative_storage_path: row.tentative_storage_path ?? null,
    trainer_hrd_storage_path: row.trainer_hrd_storage_path ?? null,
    trainer_cv_storage_path: row.trainer_cv_storage_path ?? null,
  };
}

function buildCoursePayload(draft: CourseFormState): Partial<CourseRow> {
  return {
    name: draft.name.trim(),
    date: draft.date.trim() || null,
    details: draft.details.trim(),
    trainer_names: draft.trainerNames.trim() || null,
    course_time: draft.time.trim() || null,
    venue: draft.venue.trim() || null,
    mycoid: draft.mycoid.trim() || null,
    price: draft.price.trim() || null,
    contact_person: draft.contactPerson.trim() || null,
    contact_phone: draft.contactPhone.trim() || null,
    syllabus: draft.syllabus.trim() || null,
    is_visible: draft.isVisible,
  };
}

export default function AdminCreateCourse() {
  const isEditMode = useMemo(() => {
    const path = window.location.pathname.replace(/\/+$/, "");
    return path === "/admin/courses/edit";
  }, []);

  const editingId = useMemo(() => {
    if (!isEditMode) return null;
    return new URLSearchParams(window.location.search).get("id");
  }, [isEditMode]);

  const [form, setForm] = useState<CourseFormState>(initialFormState);
  const [selectedPosterFile, setSelectedPosterFile] = useState<File | null>(null);
  const [existingPosterUrl, setExistingPosterUrl] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<OcrState>({ status: "idle" });
  const [privateSelections, setPrivateSelections] =
    useState<Record<PrivateDocKind, File | null>>(emptyPrivateSelections);
  const [existingPrivatePaths, setExistingPrivatePaths] =
    useState<CoursePrivatePaths | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

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

  const loadCourseForEdit = useCallback(async () => {
    if (!editingId) return;
    setErrorMessage(null);
    setExistingPosterUrl(null);

    const { data, error } = await supabase
      .from("courses")
      .select(
        "id,name,date,details,trainer_names,course_time,venue,mycoid,price,contact_person,contact_phone,syllabus,poster_url,is_visible,created_at,course_private_files(syllabus_storage_path,tentative_storage_path,trainer_hrd_storage_path,trainer_cv_storage_path)"
      )
      .eq("id", editingId)
      .maybeSingle();

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    if (!data) {
      setErrorMessage("Course not found.");
      return;
    }

    const row = data as CourseRow;
    setForm({
      name: row.name ?? "",
      date: row.date ?? "",
      trainerNames: row.trainer_names ?? "",
      time: row.course_time ?? "",
      venue: row.venue ?? "",
      mycoid: row.mycoid ?? "",
      price: row.price ?? "",
      contactPerson: row.contact_person ?? "",
      contactPhone: row.contact_phone ?? "",
      syllabus: row.syllabus ?? "",
      details: row.details ?? "",
      isVisible: Boolean(row.is_visible),
    });

    setExistingPrivatePaths(normalizePrivateFiles(row.course_private_files));
    setExistingPosterUrl(row.poster_url ?? null);
  }, [editingId]);

  useEffect(() => {
    if (!editingId) setExistingPosterUrl(null);
  }, [editingId]);

  useEffect(() => {
    if (!isAuthorized) return;
    if (!editingId) return;
    void loadCourseForEdit();
  }, [isAuthorized, editingId, loadCourseForEdit]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }));
      return;
    }
    setForm((prev) => ({ ...prev, [target.name]: target.value }));
  };

  const handlePosterChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedPosterFile(file);
    setOcrState({ status: "idle" });
  };

  const handlePrivateFileChange = (kind: PrivateDocKind, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setPrivateSelections((prev) => ({ ...prev, [kind]: file }));
  };

  const openPrivateDoc = async (path: string | null | undefined) => {
    if (!path) return;
    try {
      const url = await createSignedUrlForPath(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not open file.");
    }
  };

  const uploadPosterIfNeeded = async (): Promise<string | null> => {
    if (!selectedPosterFile) return null;

    const fileExt = selectedPosterFile.name.split(".").pop() || "png";
    const safeExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, "");
    const fileName = `${crypto.randomUUID()}.${safeExt || "png"}`;
    const filePath = `courses/${fileName}`;

    const contentType =
      selectedPosterFile.type || (safeExt === "pdf" ? "application/pdf" : undefined);

    const { error: uploadError } = await supabase.storage
      .from("course-posters")
      .upload(filePath, selectedPosterFile, { upsert: false, contentType });

    if (uploadError) throw new Error(uploadError.message);

    return getStoragePublicUrl("course-posters", filePath) || null;
  };

  const buildMergedPrivatePaths = async (
    courseId: string,
    existing: CoursePrivatePaths | null
  ): Promise<CoursePrivatePaths> => {
    const kinds: PrivateDocKind[] = ["syllabus", "tentative", "trainer_hrd", "trainer_cv"];

    const merged: CoursePrivatePaths = {
      syllabus_storage_path: null,
      tentative_storage_path: null,
      trainer_hrd_storage_path: null,
      trainer_cv_storage_path: null,
    };

    for (const kind of kinds) {
      const col = columnForKind(kind) as keyof CoursePrivatePaths;
      const file = privateSelections[kind];
      if (file) {
        try {
          merged[col] = await uploadCoursePrivateFile(courseId, kind, file);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          throw new Error(
            `Private file upload failed (${PRIVATE_DOC_LABELS[kind]}; storage bucket "${COURSE_PRIVATE_BUCKET}", path prefix "${courseId}/${kind}/"): ${msg}`
          );
        }
      } else {
        merged[col] = existing?.[col] ?? null;
      }
    }
    return merged;
  };

  const runPosterOcr = useCallback(async () => {
    const file = selectedPosterFile;
    if (!file) return;

    const pdf = isPdfPoster(file);
    const img = isImagePoster(file);
    if (!pdf && !img) {
      setOcrState({ status: "error", message: "Unsupported poster file type." });
      return;
    }

    try {
      setOcrState({
        status: "running",
        progressLabel: pdf ? "Rendering PDF page…" : "Preparing image…",
      });

      const imagePayload = await posterFileToExtractPayload(file);

      setOcrState({
        status: "running",
        progressLabel: "Analyzing poster with AI…",
      });

      const extracted = await extractPosterFieldsFromImage(imagePayload);
      setOcrState({ status: "done", extractedText: "" });
      setForm((prev) => mergePosterExtractionIntoForm(prev, extracted));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setOcrState({ status: "error", message: msg });
    }
  }, [selectedPosterFile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!form.name.trim()) {
      setErrorMessage("Please enter course name.");
      return;
    }

    try {
      setIsSaving(true);

      const posterUrl = await uploadPosterIfNeeded();

      if (editingId) {
        const payload = buildCoursePayload(form);
        if (posterUrl) payload.poster_url = posterUrl;

        const { error } = await supabase.from("courses").update(payload).eq("id", editingId);
        if (error) throw new Error(error.message);

        const mergedPrivate = await buildMergedPrivatePaths(editingId, existingPrivatePaths);
        if (Object.values(mergedPrivate).some(Boolean)) {
          const { error: pfError } = await supabase.from("course_private_files").upsert(
            { course_id: editingId, ...mergedPrivate, updated_at: new Date().toISOString() },
            { onConflict: "course_id" }
          );
          if (pfError) throw new Error(pfError.message);
        }

        setIsSaving(false);
        window.location.href = "/admin";
        return;
      }

      const { data: inserted, error } = await supabase
        .from("courses")
        .insert({
          ...buildCoursePayload(form),
          poster_url: posterUrl,
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);
      if (!inserted?.id) throw new Error("Could not create course.");

      const mergedPrivate = await buildMergedPrivatePaths(inserted.id, null);
      if (Object.values(mergedPrivate).some(Boolean)) {
        const { error: pfError } = await supabase.from("course_private_files").upsert(
          { course_id: inserted.id, ...mergedPrivate, updated_at: new Date().toISOString() },
          { onConflict: "course_id" }
        );
        if (pfError) throw new Error(pfError.message);
      }

      setIsSaving(false);
      window.location.href = "/admin";
    } catch (e) {
      setIsSaving(false);
      setErrorMessage(e instanceof Error ? e.message : "Failed to save course.");
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
        title={editingId ? "Update Course" : "Add New Course"}
        subtitle={editingId ? "Edit and update course details." : "Create a new course and publish it to the catalog."}
        errorMessage={errorMessage}
        isAuthChecking={isAuthChecking}
        isAuthorized={isAuthorized}
      >
        <section className="sk-card p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-primary">
              {editingId ? "Update Course" : "Add New Course"}
            </h2>
            <button
              type="button"
              onClick={() => (window.location.href = "/admin")}
              className="sk-button-secondary px-3 py-2"
              disabled={isSaving}
            >
              Back to Manage Courses
            </button>
          </div>

          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <CourseDetailsForm
              leading={
                <CoursePosterOcrPanel
                  selectedPosterFile={selectedPosterFile}
                  existingPosterUrl={existingPosterUrl}
                  isSaving={isSaving}
                  ocrState={
                    ocrState as unknown as
                      | { status: "idle" }
                      | { status: "running"; progressLabel?: string; progressPct?: number }
                      | { status: "error"; message: string }
                      | { status: "done" }
                  }
                  onPosterChange={(file) => {
                    if (!file) {
                      setSelectedPosterFile(null);
                      return;
                    }
                    handlePosterChange({
                      target: { files: [file] },
                    } as unknown as ChangeEvent<HTMLInputElement>);
                  }}
                  canRunOcr={Boolean(
                    selectedPosterFile &&
                      (isPdfPoster(selectedPosterFile) || isImagePoster(selectedPosterFile))
                  )}
                  onRunOcr={() => void runPosterOcr()}
                  onClearOcr={() => setOcrState({ status: "idle" })}
                />
              }
              form={form}
              isSaving={isSaving}
              onInputChange={handleInputChange}
              submitLabel={editingId ? "Update Course" : "Add Course"}
            >
              <CoursePrivateDocumentsPicker
                privateSelections={privateSelections}
                onPickFile={(kind, file) => {
                  handlePrivateFileChange(
                    kind,
                    ({ target: { files: file ? [file] : [] } } as unknown as ChangeEvent<HTMLInputElement>)
                  );
                }}
                editingId={editingId}
                existingPrivatePaths={existingPrivatePaths}
                onOpenExisting={(path) => void openPrivateDoc(path)}
              />
            </CourseDetailsForm>
          </form>
        </section>
      </AdminPageFrame>
    </DashboardLayout>
  );
}

