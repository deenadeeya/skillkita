import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import SiteHeader from "../../components/layout/SiteHeader";
import { supabase } from "../../lib/supabaseClient";

type UserProfileRow = {
  user_id: string;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  full_name: string;
  company_name: string | null;
};

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const check = async () => {
      const stay =
        new URLSearchParams(window.location.search).get("stay") === "1" ||
        new URLSearchParams(window.location.search).get("force") === "1";

      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;

      setHasSession(true);

      // If you're already signed in, we used to always bounce to "/".
      // That breaks common flows like "pending employer" testing where you still want /login.
      if (stay) return;

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("role,status")
        .eq("user_id", user.id)
        .maybeSingle();

      // If profile can't be loaded, don't guess—allow the login UI to render and show errors on submit.
      if (error || !profile) return;

      const row = profile as Pick<UserProfileRow, "role" | "status">;

      if (row.role === "admin") {
        window.location.href = "/";
        return;
      }

      if (row.role === "employer" && row.status === "approved") {
        window.location.href = "/";
        return;
      }

      // pending/rejected employers (and any other non-approved states): stay on /login
    };
    void check();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setPendingMessage(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Login failed. Please try again.");

      const { data: profile, error: profileError } = await supabase
        .from("user_profiles")
        .select("user_id,role,status,full_name,company_name")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          `Profile lookup failed: ${profileError.message}. Did you run supabase/auth_roles_setup.sql?`
        );
      }

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("No profile found for this user. Please sign up again.");
      }

      const row = profile as UserProfileRow;

      if (row.role === "admin") {
        window.localStorage.setItem("skillkita-role", "admin");
        window.location.href = "/";
        return;
      }

      // employer
      window.localStorage.setItem("skillkita-role", "employer");
      if (row.status === "approved") {
        window.location.href = "/";
        return;
      }

      if (row.status === "rejected") {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        throw new Error("Your account request was rejected. Please contact support.");
      }

      // pending
      setIsLoading(false);
      setPendingMessage(
        "Your account is pending approval. You can browse public pages, but employer tools will unlock after an admin approves your account."
      );
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : "Login failed.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      <SiteHeader />

      <main className="sk-container py-12">
        <div className="mx-auto max-w-md">
          <div className="sk-card p-6">
            <h1 className="text-3xl font-bold text-[#0001fc]">Log in</h1>
            <p className="mt-2 text-sm text-black">
              Log in to access employer or admin tools based on your role.
            </p>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {pendingMessage && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                {pendingMessage}
              </div>
            )}

            {hasSession && (
              <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 text-sm text-black">
                <p className="font-semibold text-[#7A1F1F]">You’re already signed in</p>
                <p className="mt-1 text-black/70">
                  If you want to log in as a different account, sign out first.
                </p>
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg border border-[#7A1F1F] px-3 py-2 text-sm font-semibold text-[#7A1F1F] hover:bg-[#7A1F1F]/5"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.localStorage.removeItem("skillkita-role");
                    window.location.href = "/login?stay=1";
                  }}
                >
                  Sign out
                </button>
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Password
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  required
                />
              </label>

              <button type="submit" disabled={isLoading} className="sk-button-primary w-full">
                {isLoading ? "Signing in..." : "Log in"}
              </button>

              <p className="text-center text-sm text-black/70">
                New here?{" "}
                <a href="/signup" className="font-semibold text-[#7A1F1F] underline">
                  Create an account
                </a>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;

