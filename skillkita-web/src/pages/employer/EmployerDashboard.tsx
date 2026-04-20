import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { employerNavItems } from "../../components/layout/navItems";
import { createQuotationPdfSignedUrl } from "../../features/quotation/storage";
import type { QuotationRequestRow } from "../../features/quotation/types";
import {
  PRIVATE_DOC_LABELS,
  columnForKind,
  createSignedUrlForPath,
  type PrivateDocKind,
} from "../../lib/coursePrivateStorage";
import { supabase } from "../../lib/supabaseClient";

type CoursePrivatePaths = {
  syllabus_storage_path: string | null;
  tentative_storage_path: string | null;
  trainer_hrd_storage_path: string | null;
  trainer_cv_storage_path: string | null;
};

type CourseListItem = {
  id: string;
  name: string;
  date: string;
};

type UserProfileRow = {
  user_id: string;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  full_name: string;
  company_name: string | null;
};

const EmployerDashboard = () => {
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [accessByCourse, setAccessByCourse] = useState<
    Record<string, "pending" | "approved" | "rejected" | undefined>
  >({});
  const [privateByCourse, setPrivateByCourse] = useState<
    Record<string, CoursePrivatePaths | null>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [quotationRows, setQuotationRows] = useState<QuotationRequestRow[]>([]);
  const [quotationsLoading, setQuotationsLoading] = useState(true);
  const [quotationError, setQuotationError] = useState<string | null>(null);
  const [downloadQuotationId, setDownloadQuotationId] = useState<string | null>(null);

  const loadData = useCallback(async (userId: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data: courseRows, error: cErr } = await supabase
      .from("courses")
      .select("id,name,date")
      .eq("is_visible", true)
      .order("date", { ascending: true });

    if (cErr) {
      setErrorMessage(cErr.message);
      setCourses([]);
      setIsLoading(false);
      return;
    }

    setCourses((courseRows ?? []) as CourseListItem[]);

    const { data: accessRows, error: aErr } = await supabase
      .from("employer_course_file_access")
      .select("course_id,status")
      .eq("employer_user_id", userId);

    if (aErr) {
      setErrorMessage(aErr.message);
    }

    const map: Record<string, "pending" | "approved" | "rejected"> = {};
    (accessRows ?? []).forEach(
      (r: { course_id: string; status: string }) => {
        map[r.course_id] = r.status as "pending" | "approved" | "rejected";
      }
    );
    setAccessByCourse(map);

    const approvedIds = Object.entries(map)
      .filter(([, s]) => s === "approved")
      .map(([id]) => id);

    if (approvedIds.length === 0) {
      setPrivateByCourse({});
      setIsLoading(false);
      return;
    }

    const { data: pfRows, error: pErr } = await supabase
      .from("course_private_files")
      .select(
        "course_id,syllabus_storage_path,tentative_storage_path,trainer_hrd_storage_path,trainer_cv_storage_path"
      )
      .in("course_id", approvedIds);

    if (pErr) {
      setErrorMessage(pErr.message);
      setPrivateByCourse({});
      setIsLoading(false);
      return;
    }

    const pfMap: Record<string, CoursePrivatePaths | null> = {};
    (pfRows ?? []).forEach(
      (row: CoursePrivatePaths & { course_id: string }) => {
        pfMap[row.course_id] = {
          syllabus_storage_path: row.syllabus_storage_path,
          tentative_storage_path: row.tentative_storage_path,
          trainer_hrd_storage_path: row.trainer_hrd_storage_path,
          trainer_cv_storage_path: row.trainer_cv_storage_path,
        };
      }
    );
    setPrivateByCourse(pfMap);
    setIsLoading(false);
  }, []);

  const loadQuotations = useCallback(async (userId: string) => {
    setQuotationsLoading(true);
    setQuotationError(null);
    const { data, error } = await supabase
      .from("quotation_requests")
      .select("*")
      .eq("employer_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setQuotationError(error.message);
      setQuotationRows([]);
    } else {
      setQuotationRows((data ?? []) as QuotationRequestRow[]);
    }
    setQuotationsLoading(false);
  }, []);

  useEffect(() => {
    const load = async () => {
      setErrorMessage(null);
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const user = data.session?.user;
      if (!user) {
        window.location.href = "/login";
        return;
      }

      setEmail(user.email ?? null);

      const { data: profileRow, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id,role,status,full_name,company_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        setErrorMessage(profileError.message);
        return;
      }

      if (!profileRow) {
        window.location.href = "/login";
        return;
      }

      const row = profileRow as UserProfileRow;
      setProfile(row);

      if (row.role !== "employer") {
        window.location.href = "/";
        return;
      }

      if (row.status !== "approved") {
        window.location.href = "/login";
        return;
      }

      await Promise.all([loadData(user.id), loadQuotations(user.id)]);
    };

    void load();
  }, [loadData, loadQuotations]);

  const requestAccess = async (courseId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;
    if (!uid) return;

    setActionId(courseId);
    setErrorMessage(null);

    const { error } = await supabase.from("employer_course_file_access").insert({
      employer_user_id: uid,
      course_id: courseId,
      status: "pending",
    });

    setActionId(null);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadData(uid);
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

  const downloadQuotationPdf = async (path: string, quotationId: string) => {
    setDownloadQuotationId(quotationId);
    setQuotationError(null);
    try {
      const url = await createQuotationPdfSignedUrl(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setQuotationError(err instanceof Error ? err.message : "Download failed.");
    } finally {
      setDownloadQuotationId(null);
    }
  };

  return (
    <DashboardLayout
      items={employerNavItems}
      userName={profile?.full_name ?? "Employer"}
      userEmail={email}
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
        <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">Dashboard</h1>
        <p className="mt-3 text-lg text-black md:text-xl">
          {profile ? `Welcome, ${profile.full_name}.` : "Welcome."}
        </p>
        <p className="mt-2 text-sm text-black/80">
          Request access to private course documents (syllabus, trainer files). An admin must approve
          before you can open them.
        </p>

        <div className="mt-6 rounded-xl border border-[#0001fc]/20 bg-white p-4 shadow-sm">
          <p className="text-xl font-semibold text-[#7A1F1F]">Quotation Application History</p>
          <p className="mt-1 text-sm text-black/80">
            Request a formal quotation for a course. After admin sets pricing and approves, download your
            PDF below or from the quotation page.
          </p>
          <a
            href="/employer/quotation"
            className="mt-3 inline-block rounded-lg bg-[#0001fc] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0001fc]/90"
          >
            Request a Quotation
          </a>

          {quotationError && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {quotationError}
            </p>
          )}

          {quotationsLoading && (
            <p className="mt-4 text-sm text-black/70">Loading quotation history…</p>
          )}
          {!quotationsLoading && quotationRows.length === 0 && !quotationError && (
            <p className="mt-4 text-sm text-black/70">No quotation requests yet.</p>
          )}
          {!quotationsLoading && quotationRows.length > 0 && (
            <ul className="mt-4 space-y-3 border-t border-[#efe1db] pt-4">
              {quotationRows.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-[#efe1db] bg-[#faf7f2] p-4 text-sm text-black"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#0001fc]">{r.course_name}</p>
                      <p className="mt-1 text-black/80">
                        Proposed: {r.proposed_date} · Participants: {r.number_of_employers}
                      </p>
                      <p className="mt-1 text-xs text-black/60">
                        Submitted: {new Date(r.created_at).toLocaleString()}
                      </p>
                      <p className="mt-1">
                        Status:{" "}
                        <span className="font-semibold capitalize">
                          {r.status === "pending" && "Pending admin review"}
                          {r.status === "approved" && "Approved — PDF ready"}
                          {r.status === "rejected" && "Rejected"}
                        </span>
                      </p>
                    </div>
                    {r.status === "approved" && r.pdf_storage_path && (
                      <button
                        type="button"
                        disabled={downloadQuotationId === r.id}
                        onClick={() => void downloadQuotationPdf(r.pdf_storage_path!, r.id)}
                        className="sk-button-primary shrink-0 px-4 py-2 text-sm"
                      >
                        {downloadQuotationId === r.id ? "Opening…" : "Download PDF"}
                      </button>
                    )}
                  </div>
                  {r.additional_description && (
                    <p className="mt-2 border-t border-[#efe1db] pt-2 text-xs text-black/75">
                      {r.additional_description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {errorMessage && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <section className="sk-card mt-8 p-6">
          <h2 className="text-xl font-bold text-[#7A1F1F]">Courses</h2>
          {isLoading && (
            <p className="mt-4 text-sm text-black">Loading...</p>
          )}
          {!isLoading && (
            <ul className="mt-4 space-y-4">
              {courses.map((c) => {
                const status = accessByCourse[c.id];
                const priv = privateByCourse[c.id];
                return (
                  <li
                    key={c.id}
                    className="rounded-xl border border-[#efe1db] bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[#0001fc]">{c.name}</h3>
                        <p className="text-sm text-[#7A1F1F]">Date: {c.date}</p>
                        <p className="mt-1 text-xs text-black/70">
                          Status:{" "}
                          <span
                            className={
                              status === "approved"
                                ? "font-bold text-green-800"
                                : status === "rejected"
                                  ? "font-bold text-red-800"
                                  : "font-semibold text-black/80"
                            }
                          >
                            {status === "approved"
                              ? "Approved — you can open private files below"
                              : status === "pending"
                                ? "Pending admin approval"
                                : status === "rejected"
                                  ? "Rejected"
                                  : "No request yet"}
                          </span>
                        </p>
                      </div>
                      {!status && (
                        <button
                          type="button"
                          disabled={actionId === c.id}
                          onClick={() => void requestAccess(c.id)}
                          className="sk-button-primary shrink-0 self-start"
                        >
                          {actionId === c.id ? "Sending..." : "Request access to private files"}
                        </button>
                      )}
                      {status === "pending" && (
                        <span className="text-sm font-semibold text-amber-800">Waiting for admin</span>
                      )}
                    </div>

                    {status === "approved" && priv && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-[#efe1db] pt-4">
                        {(Object.keys(PRIVATE_DOC_LABELS) as PrivateDocKind[]).map((kind) => {
                          const col = columnForKind(kind) as keyof CoursePrivatePaths;
                          const path = priv[col];
                          return (
                            <button
                              key={kind}
                              type="button"
                              disabled={!path}
                              onClick={() => void openPrivateDoc(path)}
                              className="rounded-md border border-[#7A1F1F] bg-[#f9f5ed] px-3 py-1.5 text-xs font-semibold text-[#7A1F1F] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {path ? `Open ${PRIVATE_DOC_LABELS[kind]}` : `${PRIVATE_DOC_LABELS[kind]} (n/a)`}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {!isLoading && courses.length === 0 && (
            <p className="mt-4 text-sm text-black">No public courses listed yet.</p>
          )}
        </section>
    </DashboardLayout>
  );
};

export default EmployerDashboard;
