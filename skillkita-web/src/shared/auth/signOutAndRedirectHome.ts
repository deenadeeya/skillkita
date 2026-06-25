import { supabase } from "../api/supabaseClient";

const LOGOUT_REDIRECT = "/";

/** End session and leave the app; always clears local role hint and navigates home. */
export async function signOutAndRedirectHome(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Continue — local session may already be cleared.
  }

  // Revoke refresh token when online; never block the UI on this.
  void supabase.auth.signOut({ scope: "global" }).catch(() => {});

  window.localStorage.removeItem("skillkita-role");
  window.location.replace(LOGOUT_REDIRECT);
}
