import { parseCoursePriceRm } from "../courses/parseCoursePrice";
import { supabase } from "../../shared/api/supabaseClient";

/** Match a catalog course by name (case-insensitive) and return price per participant. */
export async function lookupCourseUnitPriceByName(courseName: string): Promise<number | null> {
  const trimmed = courseName.trim();
  if (!trimmed) return null;

  const { data, error } = await supabase.from("courses").select("name,price");

  if (error) throw new Error(error.message);

  const needle = trimmed.toLowerCase();
  const row =
    (data ?? []).find((c) => String(c.name ?? "").trim().toLowerCase() === needle) ?? null;

  return parseCoursePriceRm(row?.price ?? null);
}
