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
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F1E8] px-6 text-center">
        <h1 className="text-3xl font-bold text-[#7A1F1F]">Access denied</h1>
        <p className="mt-2 text-base text-black md:text-lg">
          You don’t have permission to view this page.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/"
            className="rounded-lg bg-[#7A1F1F] px-4 py-2 font-semibold text-white"
          >
            Back to Home
          </a>
          <a
            href={redirectTo}
            className="rounded-lg border border-[#7A1F1F] px-4 py-2 font-semibold text-[#7A1F1F]"
          >
            Go to Log in
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
      <div className="flex min-h-screen items-center justify-center bg-[#F5F1E8] px-6 text-center">
        <p className="text-base font-semibold text-black/70">Checking access…</p>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F1E8] px-6 text-center">
        <h1 className="text-3xl font-bold text-[#7A1F1F]">Something went wrong</h1>
        <p className="mt-2 max-w-lg text-sm text-black/70">{state.message}</p>
        <a
          href="/"
          className="mt-6 rounded-lg bg-[#7A1F1F] px-4 py-2 font-semibold text-white"
        >
          Back to Home
        </a>
      </div>
    );
  }

  if (state.kind === "denied") {
    return <>{denied ?? defaultDenied}</>;
  }

  return <>{children}</>;
}

