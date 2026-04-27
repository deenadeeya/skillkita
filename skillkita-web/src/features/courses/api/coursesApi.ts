import { supabase } from "../../../shared/api/supabaseClient";

export type PublicCourseRow = {
  id: string;
  name: string;
  date: string;
  details: string;
  poster_url: string | null;
  is_visible: boolean;
  created_at: string;
};

export type CourseDetailRow = {
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
};

export async function listVisibleCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select("id,name,date,details,poster_url,is_visible,created_at")
    .eq("is_visible", true)
    .order("date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PublicCourseRow[];
}

export async function getCourseById(courseId: string) {
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id,name,date,details,trainer_names,course_time,venue,mycoid,price,contact_person,contact_phone,syllabus,poster_url,is_visible"
    )
    .eq("id", courseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as CourseDetailRow | null;
}

