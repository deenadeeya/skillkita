import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { formatSupabaseNetworkError, supabase } from "../../shared/api/supabaseClient";
import { AuthPageShell } from "../../shared/ui/AuthPageShell";
import { PasswordInput } from "../../shared/ui/PasswordInput";

type UserProfileRow = {
  user_id: string;
  role: "admin" | "employer";
  status: "pending" | "approved" | "rejected";
  full_name: string;
  company_name: string | null;
};

function getSafeRedirectUrl(): string | null {
  const redirect = new URLSearchParams(window.location.search).get("redirect")?.trim();
  if (!redirect || !redirect.startsWith("/") || redirect.startsWith("//")) return null;
  return redirect;
}

function getPostLoginRedirectUrl(role: UserProfileRow["role"]): string {
  const custom = getSafeRedirectUrl();
  if (custom) return custom;
  return role === "employer" ? "/employer" : role === "admin" ? "/admin" : "/";
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const passwordResetSuccess =
    new URLSearchParams(window.location.search).get("reset") === "success";

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) return;

      setHasSession(true);

      const stay =
        new URLSearchParams(window.location.search).get("stay") === "1" ||
        new URLSearchParams(window.location.search).get("force") === "1";

      // If the user explicitly wants to open /login (e.g. to switch accounts), don't redirect.
      if (stay) return;

      const { data: profile, error } = await supabase
        .from("user_profiles")
        .select("role,status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !profile) return;

      const row = profile as Pick<UserProfileRow, "role" | "status">;
      if (
        (row.role === "admin" || row.role === "employer") &&
        row.status !== "rejected"
      ) {
        window.location.href = getPostLoginRedirectUrl(row.role);
      }
    };
    void check();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
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
          `Profile lookup failed: ${profileError.message}. Did you run supabase migrations? See supabase/README.md.`
        );
      }

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("No profile found for this user. Please sign up again.");
      }

      const row = profile as UserProfileRow;

      if (row.role === "admin") {
        if (row.status === "rejected") {
          await supabase.auth.signOut();
          window.localStorage.removeItem("skillkita-role");
          throw new Error("Your admin account has been deactivated. Contact another administrator.");
        }
        window.localStorage.setItem("skillkita-role", "admin");
        window.location.href = getPostLoginRedirectUrl("admin");
        return;
      }

      // employer
      window.localStorage.setItem("skillkita-role", "employer");
      if (row.status === "rejected") {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        throw new Error("Your account was deactivated. Please contact support.");
      }

      window.location.href = getPostLoginRedirectUrl("employer");
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(formatSupabaseNetworkError(err));
    }
  };

  return (
    <AuthPageShell
      title="Log in"
      subtitle="Access employer or admin tools based on your account role."
    >
            {passwordResetSuccess && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Your password was updated. Log in with your new password.
              </div>
            )}

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {hasSession && (
              <div className="mt-4 rounded-xl border border-black/10 bg-white p-4 text-sm text-ink">
                <p className="font-semibold text-primary">You’re already signed in</p>
                <p className="mt-1 text-ink-muted">
                  If you want to log in as a different account, sign out first.
                </p>
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
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
                <span className="mb-1 block text-sm font-semibold text-primary">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  className="sk-input"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-primary">
                  Password
                </span>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  autoComplete="current-password"
                  required
                />
                <p className="mt-1.5 text-right text-sm">
                  <a href="/forgot-password" className="font-semibold text-primary underline">
                    Forgot password?
                  </a>
                </p>
              </label>

              <button type="submit" disabled={isLoading} className="sk-button-primary w-full">
                {isLoading ? "Signing in..." : "Log in"}
              </button>

              <p className="text-center text-sm text-ink-muted">
                New here?{" "}
                <a href="/signup" className="font-semibold text-primary underline">
                  Create an account
                </a>
              </p>
            </form>
    </AuthPageShell>
  );
};

export default Login;

