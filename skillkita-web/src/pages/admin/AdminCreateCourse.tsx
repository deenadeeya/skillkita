import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { adminNavItems } from "../../components/layout/navItems";
import PlaceholderPoster from "../../assets/placeholder.jpg";
import { CoursePosterMedia } from "../../components/CoursePosterMedia";
import {
  COURSE_PRIVATE_BUCKET,
  PRIVATE_DOC_LABELS,
  columnForKind,
  createSignedUrlForPath,
  uploadCoursePrivateFile,
  type PrivateDocKind,
} from "../../lib/coursePrivateStorage";
import { supabase } from "../../lib/supabaseClient";
import {
  createOcrWorker,
  extractPosterFields,
  isImagePoster,
  isPdfPoster,
  normalizeWhitespace,
  ocrImagePoster,
  ocrPdfPoster,
  type OcrState,
} from "./OCRCourses";

type CoursePrivatePaths = {
  syllabus_storage_path: string | null;
  tentative_storage_path: string | null;
  trainer_hrd_storage_path: string | null;
  trainer_cv_storage_path: string | null;
};

type CourseRow = {
  id: string;
  name: string;
  date: string;
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
  course_private_files:
    | CoursePrivatePaths
    | CoursePrivatePaths[]
    | null;
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

function normalizePrivateFiles(
  raw: CourseRow["course_private_files"]
): CoursePrivatePaths | null {
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

function defaultCourseDateISO() {
  return new Date().toISOString().slice(0, 10);
}

function buildCoursePayload(draft: CourseFormState): Partial<CourseRow> {
  return {
    name: draft.name.trim(),
    date: draft.date,
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
  }, [editingId]);

  useEffect(() => {
    if (!isAuthorized) return;
    if (!editingId) return;
    void loadCourseForEdit();
  }, [isAuthorized, editingId, loadCourseForEdit]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  const handlePrivateFileChange = (
    kind: PrivateDocKind,
    event: ChangeEvent<HTMLInputElement>
  ) => {
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

    const { data } = supabase.storage.from("course-posters").getPublicUrl(filePath);
    return data.publicUrl ?? null;
  };

  const buildMergedPrivatePaths = async (
    courseId: string,
    existing: CoursePrivatePaths | null
  ): Promise<CoursePrivatePaths> => {
    const kinds: PrivateDocKind[] = [
      "syllabus",
      "tentative",
      "trainer_hrd",
      "trainer_cv",
    ];

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
      setOcrState({ status: "error", message: "Unsupported poster file type for OCR." });
      return;
    }

    try {
      let combinedText = "";
      const worker = await createOcrWorker(setOcrState);
      try {
        if (pdf) combinedText = await ocrPdfPoster(file, worker, setOcrState);
        else combinedText = await ocrImagePoster(file, worker, setOcrState);
      } finally {
        await worker.terminate();
      }

      const extractedText = normalizeWhitespace(combinedText);
      setOcrState({ status: "done", extractedText });

      const extracted = extractPosterFields(extractedText);
      setForm((prev) => ({
        ...prev,
        name: prev.name.trim() ? prev.name : extracted.name ?? prev.name,
        date: prev.date.trim() ? prev.date : extracted.date ?? prev.date,
        trainerNames: prev.trainerNames.trim()
          ? prev.trainerNames
          : extracted.trainerNames ?? prev.trainerNames,
        time: prev.time.trim() ? prev.time : extracted.time ?? prev.time,
        venue: prev.venue.trim() ? prev.venue : extracted.venue ?? prev.venue,
        mycoid: prev.mycoid.trim() ? prev.mycoid : extracted.mycoid ?? prev.mycoid,
        price: prev.price.trim() ? prev.price : extracted.price ?? prev.price,
        contactPerson: prev.contactPerson.trim()
          ? prev.contactPerson
          : extracted.contactPerson ?? prev.contactPerson,
        contactPhone: prev.contactPhone.trim()
          ? prev.contactPhone
          : extracted.contactPhone ?? prev.contactPhone,
        syllabus: prev.syllabus.trim()
          ? prev.syllabus
          : extracted.syllabus ?? prev.syllabus,
        details: prev.details.trim()
          ? `${prev.details.trim()}\n\n${extracted.detailsTemplate}\n\n${extracted.summary}`
          : `${extracted.detailsTemplate}\n\n${extracted.summary}`,
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setOcrState({ status: "error", message: msg });
    }
  }, [selectedPosterFile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    if (!form.name.trim() || !form.date.trim() || !form.details.trim()) return;

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
          ...buildCoursePayload({ ...form, date: form.date || defaultCourseDateISO() }),
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
      <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">
        {editingId ? "Update Course" : "Add New Course"}
      </h1>
      <p className="mt-3 text-lg text-black md:text-xl">
        {editingId ? "Edit and update course details." : "Create a new course and publish it to the catalog."}
      </p>

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

      <div className={`mt-10 ${!isAuthorized ? "opacity-60 pointer-events-none" : ""}`}>
        <section className="sk-card p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-[#7A1F1F]">
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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Course Name / Nama Kursus
                </span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Date / Tarikh
                </span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Time / Pukul
                </span>
                <input
                  name="time"
                  value={form.time}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                  placeholder="e.g. 9:00 AM - 5:00 PM"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Venue / Lokasi
                </span>
                <input
                  name="venue"
                  value={form.venue}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Trainer name(s) / Nama jurulatih
                </span>
                <input
                  name="trainerNames"
                  value={form.trainerNames}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">MyCOID</span>
                <input
                  name="mycoid"
                  value={form.mycoid}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Price / Harga (RM)
                </span>
                <input
                  name="price"
                  value={form.price}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                  placeholder="e.g. RM 300"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Person to contact
                </span>
                <input
                  name="contactPerson"
                  value={form.contactPerson}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Phone number
                </span>
                <input
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Syllabus / Sylibus Content / Kandungan Kursus
                </span>
                <textarea
                  name="syllabus"
                  value={form.syllabus}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                Other Information
              </span>
              <textarea
                name="details"
                value={form.details}
                onChange={handleInputChange}
                rows={4}
                className="w-full rounded-lg border border-[#d8c9c2] px-3 py-2"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Poster</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,.pdf,application/pdf"
                onChange={handlePosterChange}
                className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              />
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px,1fr]">
              <CoursePosterMedia
                url={selectedPosterFile ? URL.createObjectURL(selectedPosterFile) : PlaceholderPoster}
                alt="Poster preview"
                className="aspect-[210/297] w-full rounded-lg object-cover"
              />

              <div className="rounded-xl border border-[#efe1db] bg-white p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#7A1F1F]">Poster OCR (PDF / Image)</p>
                    <p className="mt-1 text-xs text-black/70">
                      Upload a poster then extract and auto-fill fields. Runs in-browser.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={
                        isSaving ||
                        !selectedPosterFile ||
                        !(isPdfPoster(selectedPosterFile) || isImagePoster(selectedPosterFile)) ||
                        ocrState.status === "running"
                      }
                      onClick={() => void runPosterOcr()}
                      className="sk-button-secondary px-3 py-2"
                    >
                      {ocrState.status === "running" ? "Extracting…" : "Extract text"}
                    </button>
                    <button
                      type="button"
                      disabled={ocrState.status === "running"}
                      onClick={() => setOcrState({ status: "idle" })}
                      className="sk-button-secondary px-3 py-2"
                    >
                      Clear OCR
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  {ocrState.status === "idle" && (
                    <p className="text-xs text-black/60">
                      Tip: best results come from high-contrast, text-heavy posters.
                    </p>
                  )}
                  {ocrState.status === "running" && (
                    <div className="text-xs text-black/70">
                      <p className="font-semibold">{ocrState.progressLabel}</p>
                      {typeof ocrState.progressPct === "number" && (
                        <p className="mt-1">Progress: {ocrState.progressPct}%</p>
                      )}
                    </div>
                  )}
                  {ocrState.status === "error" && (
                    <p className="text-xs font-semibold text-red-700">
                      OCR failed: {ocrState.message}
                    </p>
                  )}
                  {ocrState.status === "done" && (
                    <p className="text-xs font-semibold text-emerald-700">
                      OCR done. Fields updated from extracted text.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#efe1db] bg-[#f9f5ed] p-3">
              <p className="text-sm font-semibold text-[#7A1F1F]">
                Private Documents (Restricted Access)
              </p>
              <p className="mt-1 text-xs text-black/75">
                Upload syllabus, trainer documents, etc. Employers can open these only after you approve
                their access request.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {(Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[]).map((kind) => (
                  <label key={kind} className="block">
                    <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                      {PRIVATE_DOC_LABELS[kind]}
                    </span>
                    <input
                      type="file"
                      onChange={(e) => handlePrivateFileChange(kind, e)}
                      className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 text-sm"
                    />
                  </label>
                ))}
              </div>

              {editingId && existingPrivatePaths && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[]).map((kind) => {
                    const col = columnForKind(kind) as keyof CoursePrivatePaths;
                    const path = existingPrivatePaths[col];
                    return (
                      <button
                        key={kind}
                        type="button"
                        disabled={!path}
                        onClick={() => void openPrivateDoc(path)}
                        className="rounded-md border border-[#7A1F1F] bg-white px-2 py-1 text-xs font-semibold text-[#7A1F1F] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {path ? `Open ${PRIVATE_DOC_LABELS[kind]}` : `${PRIVATE_DOC_LABELS[kind]} (none)`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-1 md:flex-row md:items-center md:justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-[#7A1F1F]">
                <input
                  type="checkbox"
                  name="isVisible"
                  checked={form.isVisible}
                  onChange={handleInputChange}
                  className="h-4 w-4"
                />
                Show to public
              </label>

              <button
                type="submit"
                disabled={isSaving}
                className="sk-button-primary"
              >
                {isSaving ? "Saving..." : editingId ? "Update Course" : "Add Course"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </DashboardLayout>
  );
}

