import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getSessionUser, getUserProfile } from "../../auth/profile";
import type { UserRole } from "../../auth/types";

type Props = {
  role: UserRole;
  requireApproved?: boolean;
  children: ReactNode;
  redirectTo?: string;
  denied?: ReactNode;
};

type State =
  | { kind: "loading" }
  | { kind: "authed"; userId: string; role: UserRole; approved: boolean }
  | { kind: "denied" }
  | { kind: "error"; message: string };

export default function RequireRole({
  role,
  requireApproved = false,
  children,
  redirectTo = "/login",
  denied,
}: Props) {
  const [state, setState] = useState<State>({ kind: "loading" });

  const defaultDenied = useMemo(() => {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <h1 className="text-3xl font-bold text-primary">Access denied</h1>
        <p className="mt-2 text-base text-ink md:text-lg">
          You don’t have permission to view this page.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a href="/" className="sk-button-primary no-underline">
            Back to home
          </a>
          <a href={redirectTo} className="sk-button-secondary no-underline">
            Go to log in
          </a>
        </div>
      </div>
    );
  }, [redirectTo]);

  useEffect(() => {
    const run = async () => {
      try {
        const user = await getSessionUser();
        if (!user) {
          window.location.href = redirectTo;
          return;
        }

        const profile = await getUserProfile(user.id);
        if (!profile) {
          window.location.href = redirectTo;
          return;
        }

        if (profile.role !== role) {
          setState({ kind: "denied" });
          return;
        }

        if (profile.role === "employer" && profile.status === "rejected") {
          window.location.href = redirectTo;
          return;
        }

        if (profile.role === "admin" && profile.status === "rejected") {
          window.location.href = redirectTo;
          return;
        }

        const approved = profile.status === "approved";
        if (requireApproved && !approved) {
          window.location.href = redirectTo;
          return;
        }

        setState({
          kind: "authed",
          userId: user.id,
          role: profile.role,
          approved,
        });
      } catch (e) {
        setState({
          kind: "error",
          message: e instanceof Error ? e.message : "Authorization failed.",
        });
      }
    };

    void run();
  }, [redirectTo, requireApproved, role]);

  if (state.kind === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-6 text-center">
        <p className="text-base font-semibold text-ink-muted">Checking access…</p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
        <h1 className="text-3xl font-bold text-primary">Something went wrong</h1>
        <p className="mt-2 max-w-lg text-sm text-ink-muted">{state.message}</p>
        <a href="/" className="sk-button-primary mt-6 no-underline">
          Back to home
        </a>
      </div>
    );
  }

  if (state.kind === "denied") {
    return <>{denied ?? defaultDenied}</>;
  }

  return <>{children}</>;
}

