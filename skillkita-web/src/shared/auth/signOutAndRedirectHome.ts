import { supabase } from "../api/supabaseClient";

/** End session and leave the app; always clears local role hint and navigates home. */
export async function signOutAndRedirectHome(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    try {
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // Still clear client state below.
    }
  } finally {
    window.localStorage.removeItem("skillkita-role");
    window.location.replace("/");
  }
}
