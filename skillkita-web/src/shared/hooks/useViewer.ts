import { useEffect, useState } from "react";
import { getSessionUser, getUserProfile } from "../../app/auth/profile";
import type { UserProfileRow, UserRole } from "../../app/auth/types";
import { supabase } from "../api/supabaseClient";

export type Viewer = {
  userId: string;
  email: string | null;
  role: UserRole;
  status: UserProfileRow["status"];
  fullName: string;
  companyName: string | null;
  companyAddress: string | null;
};

export type ViewerState =
  | { kind: "loading" }
  | { kind: "anonymous" }
  | { kind: "signedInNoProfile"; email: string | null; userId: string }
  | { kind: "signedIn"; viewer: Viewer };

export function useViewer(): ViewerState {
  const [state, setState] = useState<ViewerState>({ kind: "loading" });

  useEffect(() => {
    const run = async () => {
      try {
        const user = await getSessionUser();
        if (!user) {
          setState({ kind: "anonymous" });
          return;
        }

        const email = user.email ?? null;
        const profile = await getUserProfile(user.id);
        if (!profile) {
          setState({ kind: "signedInNoProfile", email, userId: user.id });
          return;
        }

        setState({
          kind: "signedIn",
          viewer: {
            userId: profile.user_id,
            email,
            role: profile.role,
            status: profile.status,
            fullName: profile.full_name,
            companyName: profile.company_name ?? null,
            companyAddress: profile.company_address ?? null,
          },
        });
      } catch {
        // Fail closed: treat as anonymous for public pages.
        setState({ kind: "anonymous" });
      }
    };

    void run();

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      void run();
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}

