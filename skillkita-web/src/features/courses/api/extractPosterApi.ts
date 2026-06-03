import { supabase } from "../../../shared/api/supabaseClient";
import type { PosterExtractedFields } from "../utils/applyPosterExtraction";
import type { PosterImagePayload } from "../utils/posterImageForExtract";

export async function extractPosterFieldsFromImage(
  payload: PosterImagePayload
): Promise<PosterExtractedFields> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);

  const token = sessionData.session?.access_token;
  if (!token) throw new Error("You must be logged in as admin.");

  const res = await fetch("/api/extract-poster", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      mimeType: payload.mimeType,
      imageBase64: payload.imageBase64,
    }),
  });

  const body = (await res.json().catch(() => ({}))) as { message?: string; fields?: PosterExtractedFields };
  if (!res.ok) {
    throw new Error(body.message || `Extraction failed (${res.status}).`);
  }

  if (!body.fields) {
    throw new Error("No fields returned from poster extraction.");
  }

  return body.fields;
}
