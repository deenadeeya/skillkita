const AccessDenied = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F1E8] px-6 text-center">
    <h1 className="text-4xl font-bold text-[#7A1F1F]">Admin Access Required</h1>
    <p className="mt-3 text-base text-black md:text-lg">
      This page is for admin users only.
    </p>
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <a
        href="/"
        className="rounded-lg bg-[#7A1F1F] px-4 py-2 font-semibold text-white"
      >
        Back to Landing Page
      </a>
      <a
        href="/login"
        className="rounded-lg border border-[#7A1F1F] px-4 py-2 font-semibold text-[#7A1F1F]"
      >
        Go to Log in
      </a>
    </div>
  </div>
);

export default AccessDenied;

