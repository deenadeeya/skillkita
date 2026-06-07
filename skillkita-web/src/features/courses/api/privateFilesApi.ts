import { supabase } from "../../../shared/api/supabaseClient";

export type CoursePrivatePaths = {
  course_id?: string;
  syllabus_storage_path: string | null;
  syllabus_file_name: string | null;
  tentative_storage_path: string | null;
  tentative_file_name: string | null;
  trainer_hrd_storage_path: string | null;
  trainer_hrd_file_name: string | null;
  trainer_cv_storage_path: string | null;
  trainer_cv_file_name: string | null;
};

const PRIVATE_FILES_SELECT =
  "course_id,syllabus_storage_path,syllabus_file_name,tentative_storage_path,tentative_file_name,trainer_hrd_storage_path,trainer_hrd_file_name,trainer_cv_storage_path,trainer_cv_file_name";

export async function getCoursePrivateFilesByCourseId(courseId: string) {
  const { data, error } = await supabase
    .from("course_private_files")
    .select(PRIVATE_FILES_SELECT)
    .eq("course_id", courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as CoursePrivatePaths | null;
}

export async function listCoursePrivateFilesByCourseIds(courseIds: string[]) {
  if (courseIds.length === 0) return [] as CoursePrivatePaths[];

  const { data, error } = await supabase
    .from("course_private_files")
    .select(PRIVATE_FILES_SELECT)
    .in("course_id", courseIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as CoursePrivatePaths[];
}
