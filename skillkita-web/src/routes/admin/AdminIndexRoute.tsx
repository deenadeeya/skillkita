import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { AdminCoursesPanel } from "../../features/courses/components/AdminCoursesPanel";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";
import { createSignedUrlForPath } from "../../features/courses/storage/coursePrivateStorage";
import type { CoursePrivatePaths } from "../../features/courses/api/privateFilesApi";
import { supabase } from "../../shared/api/supabaseClient";

type Course = {
  id: string;
  name: string;
  date: string | null;
  trainerNames: string;
  time: string;
  venue: string;
  mycoid: string;
  price: string;
  contactPerson: string;
  contactPhone: string;
  syllabus: string;
  details: string;
  posterUrl: string | null;
  isVisible: boolean;
  privateFiles: CoursePrivatePaths | null;
};

// NOTE: course create/update form moved to `AdminCreateCourse.tsx`

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

function normalizePrivateFiles(raw: CourseRow["course_private_files"]): CoursePrivatePaths | null {
  if (!raw) return null;
  const row = Array.isArray(raw) ? raw[0] : raw;
  if (!row) return null;
  return {
    syllabus_storage_path: row.syllabus_storage_path ?? null,
    syllabus_file_name: row.syllabus_file_name ?? null,
    tentative_storage_path: row.tentative_storage_path ?? null,
    tentative_file_name: row.tentative_file_name ?? null,
    trainer_hrd_storage_path: row.trainer_hrd_storage_path ?? null,
    trainer_hrd_file_name: row.trainer_hrd_file_name ?? null,
    trainer_cv_storage_path: row.trainer_cv_storage_path ?? null,
    trainer_cv_file_name: row.trainer_cv_file_name ?? null,
  };
}

function mapRowToCourse(row: CourseRow): Course {
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    trainerNames: row.trainer_names ?? "",
    time: row.course_time ?? "",
    venue: row.venue ?? "",
    mycoid: row.mycoid ?? "",
    price: row.price ?? "",
    contactPerson: row.contact_person ?? "",
    contactPhone: row.contact_phone ?? "",
    syllabus: row.syllabus ?? "",
    details: row.details,
    posterUrl: row.poster_url,
    isVisible: row.is_visible,
    privateFiles: normalizePrivateFiles(row.course_private_files),
  };
}

const AdminManageCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [courseSearch, setCourseSearch] = useState("");

  const publicCourses = useMemo(() => courses.filter((course) => course.isVisible), [courses]);

  const filteredCourses = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => {
      const haystack =
        `${c.name}\n${c.trainerNames}\n${c.venue}\n${c.mycoid}\n${c.contactPerson}\n${c.contactPhone}\n${c.details}\n${c.syllabus}\n${c.date}\n${c.time}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [courseSearch, courses]);

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

  const loadCourses = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await supabase
      .from("courses")
      .select(
        "id,name,date,details,trainer_names,course_time,venue,mycoid,price,contact_person,contact_phone,syllabus,poster_url,is_visible,created_at,course_private_files(syllabus_storage_path,syllabus_file_name,tentative_storage_path,tentative_file_name,trainer_hrd_storage_path,trainer_hrd_file_name,trainer_cv_storage_path,trainer_cv_file_name)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setCourses([]);
      setIsLoading(false);
      return;
    }

    setCourses((data ?? []).map((r) => mapRowToCourse(r as CourseRow)));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }
    void loadCourses();
  }, [isAuthorized, loadCourses]);

  const openPrivateDoc = async (path: string | null | undefined) => {
    if (!path) return;
    try {
      const url = await createSignedUrlForPath(path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not open file.");
    }
  };

  const goToCreateCourse = () => {
    window.location.href = "/admin/courses/create";
  };

  const goToEditCourse = (courseId: string) => {
    window.location.href = `/admin/courses/edit?id=${encodeURIComponent(courseId)}`;
  };

  const handleDelete = async (courseId: string) => {
    setErrorMessage(null);
    setIsSaving(true);

    const { error } = await supabase.from("courses").delete().eq("id", courseId);

    if (error) {
      setIsSaving(false);
      setErrorMessage(error.message);
      return;
    }

    await loadCourses();
    setIsSaving(false);
  };

  const handleVisibilityToggle = async (courseId: string) => {
    setErrorMessage(null);
    const course = courses.find((item) => item.id === courseId);
    if (!course) {
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("courses")
      .update({ is_visible: !course.isVisible })
      .eq("id", courseId);

    if (error) {
      setIsSaving(false);
      setErrorMessage(error.message);
      return;
    }

    await loadCourses();
    setIsSaving(false);
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
        title="Manage Course"
        headerVariant="hero"
        subtitle="Add, update, delete, and control public visibility for courses in the catalog."
        errorMessage={errorMessage}
        isAuthChecking={isAuthChecking}
        isAuthorized={isAuthorized}
      >
        <div className="space-y-8">
          <AdminCoursesPanel
            courses={courses}
            filteredCourses={filteredCourses}
            publicCount={publicCourses.length}
            isLoading={isLoading}
            isSaving={isSaving}
            searchValue={courseSearch}
            onSearchChange={setCourseSearch}
            onCreateCourse={goToCreateCourse}
            onEditCourse={goToEditCourse}
            onDeleteCourse={(id) => void handleDelete(id)}
            onToggleVisibility={(id) => void handleVisibilityToggle(id)}
            onOpenPrivateDoc={(path) => void openPrivateDoc(path)}
          />
        </div>
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminManageCourses;

