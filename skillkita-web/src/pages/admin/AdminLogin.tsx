import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import SiteHeader from "../../components/layout/SiteHeader";
import { supabase } from "../../lib/supabaseClient";

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Login failed. Please try again.");

      // Authorization check: must exist in admin_users.
      const { data: adminRow, error: adminError } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (adminError) {
        throw new Error(
          `Admin check failed: ${adminError.message}. Ensure table public.admin_users exists and RLS/policies allow select for authenticated users.`
        );
      }

      if (!adminRow) {
        await supabase.auth.signOut();
        throw new Error("This account is not an admin.");
      }

      // Keep existing simple role gate for routing.
      window.localStorage.setItem("skillkita-role", "admin");
      window.location.href = "/admin?role=admin";
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : "Login failed.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      <SiteHeader menuLinks={[{ label: "Home", href: "/" }]} />

      <main className="sk-container py-12">
        <div className="mx-auto max-w-md">
          <div className="sk-card p-6">
            <h1 className="text-3xl font-bold text-[#0001fc]">Admin Login</h1>
            <p className="mt-2 text-sm text-black">
              Sign in to manage courses and company profile.
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
                {isLoading ? "Signing in..." : "Sign in"}
              </button>

              <p className="text-center text-xs text-black/70">
                You must be listed in <code className="font-semibold">admin_users</code>.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;

