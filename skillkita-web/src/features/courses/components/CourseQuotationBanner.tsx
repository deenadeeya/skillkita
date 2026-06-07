const QUOTATION_PATH = "/employer/quotation";

type Props = {
  viewerRole: "admin" | "employer" | null;
  variant?: "browse" | "detail";
};

export function CourseQuotationBanner({ viewerRole, variant = "browse" }: Props) {
  if (viewerRole === "admin") return null;

  const headline =
    variant === "detail"
      ? "Interested to book this course? Get a quotation from us now."
      : "Interested to book a course? Get a quotation from us now.";

  const loginHref = `/login?redirect=${encodeURIComponent(QUOTATION_PATH)}`;

  return (
    <aside
      className="rounded-hero border-2 border-secondary bg-gradient-to-r from-primary to-[#6b1515] px-5 py-5 shadow-card sm:px-8 sm:py-6"
      aria-label="Quotation announcement"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-secondary">Request a quotation</p>
          <p className="mt-1 font-heading text-lg font-semibold text-white sm:text-xl">{headline}</p>
          {viewerRole !== "employer" ? (
            <p className="mt-2 text-sm text-white/90">
              Sign in or register as an employer to access the create quotation page.
            </p>
          ) : (
            <p className="mt-2 text-sm text-white/90">
              Submit your booking details and our team will prepare a quotation for you.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {viewerRole === "employer" ? (
            <a href={QUOTATION_PATH} className="sk-button-gold min-w-[180px] no-underline">
              Create quotation
            </a>
          ) : (
            <>
              <a href={loginHref} className="sk-button-gold min-w-[140px] no-underline">
                Sign in
              </a>
              <a
                href="/signup"
                className="sk-button inline-flex min-w-[140px] items-center justify-center border-2 border-white/90 bg-transparent text-white no-underline hover:bg-white/10"
              >
                Register
              </a>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
