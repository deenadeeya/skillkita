import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import SiteHeader from "../../app/layout/SiteHeader";
import { supabase } from "../../shared/api/supabaseClient";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // If already logged in, bounce to admin.
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        window.location.href = "/admin?role=admin";
      }
    };
    void check();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Deprecated: kept for backward compatibility. Use /login instead.
      // We simply redirect to the unified login page.
      window.location.href = "/login";
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
            <h1 className="text-3xl font-bold text-[#0001fc]">Admin Login</h1>
            <p className="mt-2 text-sm text-black">
              This page has been replaced. Please use the main login.
            </p>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
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
                  placeholder="admin@company.com"
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
                  placeholder="••••••••"
                  required
                />
              </label>

              <button type="submit" disabled={isLoading} className="sk-button-primary w-full">
                {isLoading ? "Redirecting..." : "Go to Log in"}
              </button>

              <p className="text-center text-xs text-black/70">
                Use the unified <code className="font-semibold">/login</code> page.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;

