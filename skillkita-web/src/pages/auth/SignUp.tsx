import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import SiteHeader from "../../components/layout/SiteHeader";
import { supabase } from "../../lib/supabaseClient";

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        window.location.href = "/";
      }
    };
    void check();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            company_name: companyName.trim() || undefined,
            phone: phone.trim() || undefined,
          },
        },
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error("Sign up failed. Please try again.");

      // Profile row is created by DB trigger public.handle_new_user() (auth_profile_trigger.sql
      // or end of auth_roles_setup.sql). Client insert fails when signUp returns no session
      // (e.g. email confirmation): JWT is anon, so RLS blocks profiles_insert_self.
      if (data.session) {
        const { error: profileError } = await supabase.from("user_profiles").insert({
          user_id: data.user.id,
          full_name: fullName.trim(),
          company_name: companyName.trim() ? companyName.trim() : null,
          phone: phone.trim() ? phone.trim() : null,
          role: "employer",
          status: "pending",
        });

        if (
          profileError &&
          profileError.code !== "23505" &&
          !profileError.message.toLowerCase().includes("duplicate")
        ) {
          throw new Error(
            `Profile setup failed: ${profileError.message}. Run supabase/auth_profile_trigger.sql (or full auth_roles_setup.sql) so signup works without a session.`
          );
        }
      }

      setIsLoading(false);
      setSuccessMessage(
        "Account created. You can log in now, but access will be unlocked after admin approval."
      );
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : "Sign up failed.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F5F1E8]">
      <SiteHeader />

      <main className="sk-container py-12">
        <div className="mx-auto max-w-xl">
          <div className="sk-card p-6">
            <h1 className="text-3xl font-bold text-[#0001fc]">Create account</h1>
            <p className="mt-2 text-sm text-black">
              Sign up as an employer. An admin will approve your account before you can access employer tools.
            </p>

            {errorMessage && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                {successMessage}{" "}
                <a className="font-semibold underline" href="/login">
                  Go to Log in
                </a>
                .
              </div>
            )}

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                    Full name
                  </span>
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.currentTarget.value)}
                    className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                    Phone number
                  </span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.currentTarget.value)}
                    className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                    placeholder="Optional"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Company name
                </span>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  placeholder="Optional"
                />
              </label>

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
                {isLoading ? "Creating..." : "Sign up"}
              </button>

              <p className="text-center text-sm text-black/70">
                Already have an account?{" "}
                <a href="/login" className="font-semibold text-[#7A1F1F] underline">
                  Log in
                </a>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SignUp;

