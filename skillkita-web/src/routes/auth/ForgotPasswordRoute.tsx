import type { FormEvent } from "react";
import { useState } from "react";
import { formatSupabaseNetworkError, supabase } from "../../shared/api/supabaseClient";
import { AuthPageShell } from "../../shared/ui/AuthPageShell";

function resetPasswordRedirectUrl(): string {
  return `${window.location.origin}/reset-password`;
}

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: resetPasswordRedirectUrl(),
      });
      if (error) throw new Error(error.message);

      setSuccessMessage(
        "If an account exists for that email, we sent a password reset link. Check your inbox and spam folder."
      );
    } catch (err) {
      setErrorMessage(formatSupabaseNetworkError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageShell
      title="Forgot password"
      subtitle="Enter your account email and we'll send you a link to choose a new password."
    >
            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                {successMessage}
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-primary">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  className="sk-input"
                  autoComplete="email"
                  required
                />
              </label>

              <button type="submit" disabled={isLoading} className="sk-button-primary w-full">
                {isLoading ? "Sending…" : "Send reset link"}
              </button>

              <p className="text-center text-sm text-ink-muted">
                Remember your password?{" "}
                <a href="/login" className="font-semibold text-primary underline">
                  Back to log in
                </a>
              </p>
            </form>
    </AuthPageShell>
  );
};

export default ForgotPassword;
