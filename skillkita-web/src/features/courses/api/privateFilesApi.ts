import { supabase } from "../../../shared/api/supabaseClient";

export type AccessStatus = "pending" | "approved" | "rejected";

export type CoursePrivatePaths = {
  course_id: string;
  syllabus_storage_path: string | null;
  tentative_storage_path: string | null;
  trainer_hrd_storage_path: string | null;
  trainer_cv_storage_path: string | null;
};

export async function requestCoursePrivateFilesAccess(params: {
  employerUserId: string;
  courseId: string;
}) {
  const { error } = await supabase.from("employer_course_file_access").insert({
    employer_user_id: params.employerUserId,
    course_id: params.courseId,
    status: "pending",
  });

  if (error) throw new Error(error.message);
}

export async function listEmployerAccessRows(employerUserId: string) {
  const { data, error } = await supabase
    .from("employer_course_file_access")
    .select("course_id,status")
    .eq("employer_user_id", employerUserId);

  if (error) throw new Error(error.message);
  return (data ?? []) as { course_id: string; status: AccessStatus }[];
}

export async function getEmployerAccessStatus(params: {
  employerUserId: string;
  courseId: string;
}) {
  const { data, error } = await supabase
    .from("employer_course_file_access")
    .select("status")
    .eq("employer_user_id", params.employerUserId)
    .eq("course_id", params.courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const status = (data as { status?: string } | null)?.status ?? null;
  if (status === "pending" || status === "approved" || status === "rejected") return status;
  return null;
}

export async function getCoursePrivateFilesByCourseId(courseId: string) {
  const { data, error } = await supabase
    .from("course_private_files")
    .select(
      "course_id,syllabus_storage_path,tentative_storage_path,trainer_hrd_storage_path,trainer_cv_storage_path"
    )
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as CoursePrivatePaths | null;
}

export async function listCoursePrivateFilesByCourseIds(courseIds: string[]) {
  if (courseIds.length === 0) return [] as CoursePrivatePaths[];

  const { data, error } = await supabase
    .from("course_private_files")
    .select(
      "course_id,syllabus_storage_path,tentative_storage_path,trainer_hrd_storage_path,trainer_cv_storage_path"
    )
    .in("course_id", courseIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as CoursePrivatePaths[];
}

