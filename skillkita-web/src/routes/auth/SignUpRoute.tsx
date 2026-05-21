import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import SiteHeader from "../../app/layout/SiteHeader";
import { supabase } from "../../shared/api/supabaseClient";

function RequiredStar() {
  return (
    <span className="text-red-600" aria-hidden="true">
      *
    </span>
  );
}

const INDEPENDENT_COMPANY_LABEL = "Independent";

type CompanyAffiliation = "company" | "independent";

const SignUp = () => {
  const [fullName, setFullName] = useState("");
  const [companyAffiliation, setCompanyAffiliation] = useState<CompanyAffiliation>("company");
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

    const trimmedFullName = fullName.trim();
    const trimmedCompanyInput = companyName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const resolvedCompanyName =
      companyAffiliation === "independent" ? INDEPENDENT_COMPANY_LABEL : trimmedCompanyInput;

    if (!trimmedFullName || !trimmedEmail || !trimmedPhone) {
      setErrorMessage("Please fill in full name, email, and phone number.");
      return;
    }
    if (companyAffiliation === "company" && !trimmedCompanyInput) {
      setErrorMessage("Please enter your company name or select Independent.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            full_name: trimmedFullName,
            company_name: resolvedCompanyName,
            phone: trimmedPhone,
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
          full_name: trimmedFullName,
          company_name: resolvedCompanyName,
          phone: trimmedPhone,
          role: "employer",
          status: "approved",
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

      if (data.session) {
        window.localStorage.setItem("skillkita-role", "employer");
        window.location.href = "/employer";
        return;
      }

      setSuccessMessage("Account created. Log in to access your employer dashboard.");
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
            <h1 className="text-3xl font-bold text-[#0001fc]">Create Account</h1>
            <p className="mt-2 text-sm text-black">
              Sign up as an employer. You can access the employer dashboard right after creating your account.
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
                    Full name <RequiredStar />
                  </span>
                  <input
                    name="name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.currentTarget.value)}
                    className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                    Phone number <RequiredStar />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.currentTarget.value)}
                    className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                    required
                  />
                </label>
              </div>

              <fieldset className="block space-y-3">
                <legend className="mb-1 text-sm font-semibold text-[#7A1F1F]">Company affiliation</legend>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="company-affiliation"
                      checked={companyAffiliation === "company"}
                      onChange={() => setCompanyAffiliation("company")}
                    />
                    Company / organisation
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="company-affiliation"
                      checked={companyAffiliation === "independent"}
                      onChange={() => {
                        setCompanyAffiliation("independent");
                        setCompanyName("");
                      }}
                    />
                    Independent
                  </label>
                </div>
                {companyAffiliation === "company" ? (
                  <label className="block">
                    <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                      Company name <RequiredStar />
                    </span>
                    <input
                      name="organization"
                      autoComplete="organization"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.currentTarget.value)}
                      className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                      required
                    />
                  </label>
                ) : (
                  <p className="text-sm text-black/70">
                    You are signing up as an independent employer. No company name is required.
                  </p>
                )}
              </fieldset>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Email <RequiredStar />
                </span>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
                  Password <RequiredStar />
                </span>
                <input
                  type="password"
                  name="new-password"
                  autoComplete="new-password"
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

