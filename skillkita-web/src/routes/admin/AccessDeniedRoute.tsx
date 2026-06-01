const AccessDenied = () => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
    <h1 className="text-4xl font-bold text-primary">Admin Access Required</h1>
    <p className="mt-3 text-base text-ink md:text-lg">
      This page is for admin users only.
    </p>
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
      <a href="/" className="sk-button-primary no-underline">
        Back to landing page
      </a>
      <a href="/login" className="sk-button-secondary no-underline">
        Go to log in
      </a>
    </div>
  </div>
);

export default AccessDenied;

