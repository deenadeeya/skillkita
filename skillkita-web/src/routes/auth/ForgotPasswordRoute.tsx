import type { FormEvent } from "react";
import { useState } from "react";
import SiteHeader from "../../app/layout/SiteHeader";
import { formatSupabaseNetworkError, supabase } from "../../shared/api/supabaseClient";

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
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      <SiteHeader />

      <main className="sk-container py-12">
        <div className="mx-auto max-w-md">
          <div className="sk-card p-6">
            <h1 className="text-3xl font-bold text-[#0001fc]">Forgot password</h1>
            <p className="mt-2 text-sm text-black">
              Enter your account email and we&apos;ll send you a link to choose a new password.
            </p>

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
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  autoComplete="email"
                  required
                />
              </label>

              <button type="submit" disabled={isLoading} className="sk-button-primary w-full">
                {isLoading ? "Sending…" : "Send reset link"}
              </button>

              <p className="text-center text-sm text-black/70">
                Remember your password?{" "}
                <a href="/login" className="font-semibold text-[#7A1F1F] underline">
                  Back to log in
                </a>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
