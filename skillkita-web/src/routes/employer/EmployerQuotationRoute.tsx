import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { employerNavItems } from "../../app/layout/navItems";
import { supabase } from "../../shared/api/supabaseClient";
import { useViewer } from "../../shared/hooks/useViewer";
import { listVisibleCourses, type PublicCourseRow } from "../../features/courses/api/coursesApi";
import { createEmployerQuotationRequest } from "../../features/quotation/api/quotationRequestsApi";

type CourseLabel = Pick<PublicCourseRow, "id" | "name" | "date" | "created_at">;

const EmployerQuotationRequest = () => {
  const viewerState = useViewer();
  const [courseName, setCourseName] = useState("");
  const [courseOptions, setCourseOptions] = useState<CourseLabel[]>([]);
  const [numberOfEmployers, setNumberOfEmployers] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [additionalDescription, setAdditionalDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCourseOptions = useCallback(async () => {
    try {
      const rows = await listVisibleCourses();
      setCourseOptions(
        rows.map((c) => ({
          id: c.id,
          name: c.name,
          date: c.date,
          created_at: c.created_at,
        }))
      );
    } catch (e) {
      setCourseOptions([]);
      setErrorMessage(e instanceof Error ? e.message : "Failed to load courses.");
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    void loadCourseOptions().finally(() => setIsLoading(false));
  }, [loadCourseOptions]);

  const courseNameSuggestions = useMemo(() => {
    const uniq = new Map<string, CourseLabel>();
    for (const c of courseOptions) {
      const key = c.name.trim().toLowerCase();
      if (!key) continue;
      if (!uniq.has(key)) uniq.set(key, c);
    }
    return Array.from(uniq.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [courseOptions]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const normalized = courseName.trim().toLowerCase();
    const isKnownCourse =
      normalized.length > 0 &&
      courseOptions.some((c) => c.name.trim().toLowerCase() === normalized);

    const n = parseInt(numberOfEmployers, 10);
    if (!courseName.trim() || !proposedDate || !Number.isFinite(n) || n < 1) {
      setErrorMessage("Please fill course name, a valid number of participants (≥ 1), and proposed date.");
      return;
    }

    if (!isKnownCourse) {
      setErrorMessage("Please select an existing course from the list.");
      return;
    }

    if (viewerState.kind !== "signedIn") {
      setErrorMessage("Not authenticated.");
      return;
    }
    const viewer = viewerState.viewer;
    if (viewer.role !== "employer" || viewer.status !== "approved") {
      setErrorMessage("Employer account not approved.");
      return;
    }

    const snapshot = viewer.companyName?.trim() || `${viewer.fullName} (no company name on profile)`;

    setIsSubmitting(true);
    try {
      await createEmployerQuotationRequest({
        employer_user_id: viewer.userId,
        company_name_snapshot: snapshot,
        course_name: courseName.trim(),
        number_of_employers: n,
        proposed_date: proposedDate,
        additional_description: additionalDescription.trim() || null,
      });
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to submit request.");
      return;
    }

    window.location.href = "/employer";
  };

  return (
    <DashboardLayout
      items={employerNavItems}
      userName={viewerState.kind === "signedIn" ? viewerState.viewer.fullName : "Employer"}
      userEmail={viewerState.kind === "signedIn" ? viewerState.viewer.email : null}
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
        <div className="flex flex-col items-center text-center">
          <a
            href="/employer"
            className="sk-button-secondary rounded-xl px-5 py-2.5 text-sm font-semibold no-underline"
          >
            ← Back to employer dashboard
          </a>
          <h1 className="mt-6 text-4xl font-bold text-[#0001fc] md:text-5xl">Request a Quotation</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-black">
            Submit your course details below. An administrator will review your request, set pricing, and
            approve it. When approved, you can download your quotation as a PDF from this page.
          </p>
        </div>

        {errorMessage && (
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="sk-card mx-auto mt-8 max-w-2xl overflow-hidden p-6 md:p-8">
          <div className="border-b border-black/5 pb-5">
            <h2 className="text-xl font-bold text-[#7A1F1F] md:text-2xl">New Quotation Application</h2>
            <p className="mt-2 text-sm leading-relaxed text-black/70">
              Fill in the details below. Fields marked with your profile company are shown for your
              reference.
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-[#0001fc]/15 bg-gradient-to-br from-white to-[#f8f7ff] p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7A1F1F]">
              Company on file
            </p>
            <p className="mt-1 text-sm font-semibold text-[#0001fc]">
              {viewerState.kind === "signedIn" && viewerState.viewer.companyName?.trim()
                ? viewerState.viewer.companyName
                : "— (add company in profile if missing)"}
            </p>
          </div>

          <form className="mt-6 space-y-5" onSubmit={(ev) => void handleSubmit(ev)}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-[#7A1F1F]">Course name</span>
                <input
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#7A1F1F]/35 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                  placeholder="e.g. HRD Corp–claimable leadership workshop"
                  list="employer-course-name-options"
                  required
                />
                <datalist id="employer-course-name-options">
                  {courseNameSuggestions.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
                <p className="mt-1 text-xs text-black/60">
                  Start typing to search and select an existing course.
                </p>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-[#7A1F1F]">
                  Number of participants
                </span>
                <input
                  type="number"
                  min={1}
                  value={numberOfEmployers}
                  onChange={(e) => setNumberOfEmployers(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-[#7A1F1F]/35 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-[#7A1F1F]">Proposed date</span>
                <input
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-[#7A1F1F]/35 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                  required
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#7A1F1F]">
                Additional description
                <span className="ml-1 font-normal text-black/50">(optional)</span>
              </span>
              <textarea
                value={additionalDescription}
                onChange={(e) => setAdditionalDescription(e.target.value)}
                rows={4}
                className="min-h-[7rem] w-full resize-y rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[#7A1F1F]/35 focus:outline-none focus:ring-2 focus:ring-[#7A1F1F]/20"
                placeholder="Venue preferences, cohort size, contact person, etc."
              />
            </label>
            <div className="flex justify-center border-t border-black/5 pt-6">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="sk-button-primary min-w-[10rem] rounded-xl px-8 py-2.5 text-base shadow-md shadow-[#7A1F1F]/15 transition hover:shadow-lg hover:shadow-[#7A1F1F]/20 disabled:shadow-none"
              >
                {isSubmitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </form>
        </section>

        
    </DashboardLayout>
  );
};

export default EmployerQuotationRequest;

