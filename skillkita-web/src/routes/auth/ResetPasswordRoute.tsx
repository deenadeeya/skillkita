import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { formatSupabaseNetworkError, supabase } from "../../shared/api/supabaseClient";
import { AuthPageShell } from "../../shared/ui/AuthPageShell";
import { PasswordInput } from "../../shared/ui/PasswordInput";

type PageState = "loading" | "ready" | "invalid";

const ResetPassword = () => {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const isRecoveryLink =
        hashParams.get("type") === "recovery" || hashParams.has("access_token");

      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error) {
        setErrorMessage(formatSupabaseNetworkError(error));
        setPageState("invalid");
        return;
      }

      if (data.session || isRecoveryLink) {
        setPageState("ready");
        return;
      }

      setPageState("invalid");
    };

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPageState("ready");
      }
    });

    void init();

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);

      await supabase.auth.signOut();
      window.localStorage.removeItem("skillkita-role");
      window.location.href = "/login?reset=success";
    } catch (err) {
      setErrorMessage(formatSupabaseNetworkError(err));
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell title="Set new password" subtitle="Choose a new password for your account.">
            {pageState === "loading" && (
              <p className="mt-6 text-sm text-ink-muted">Verifying reset link…</p>
            )}

            {pageState === "invalid" && (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  {errorMessage ||
                    "This reset link is invalid or has expired. Request a new one from the forgot password page."}
                </div>
                <a href="/forgot-password" className="sk-button-primary block w-full text-center no-underline">
                  Request new reset link
                </a>
                <p className="text-center text-sm text-ink-muted">
                  <a href="/login" className="font-semibold text-primary underline">
                    Back to log in
                  </a>
                </p>
              </div>
            )}

            {pageState === "ready" && (
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-primary">New password</span>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-primary">
                    Confirm new password
                  </span>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </label>

                <button type="submit" disabled={isLoading} className="sk-button-primary w-full">
                  {isLoading ? "Saving…" : "Update password"}
                </button>

                <p className="text-center text-sm text-ink-muted">
                  <a href="/login" className="font-semibold text-primary underline">
                    Back to log in
                  </a>
                </p>
              </form>
            )}
    </AuthPageShell>
  );
};

export default ResetPassword;
