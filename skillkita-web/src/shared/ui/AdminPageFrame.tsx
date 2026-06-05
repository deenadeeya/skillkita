import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  headerVariant?: "default" | "hero";
  errorMessage?: string | null;
  isAuthChecking?: boolean;
  isAuthorized?: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageFrame({
  title,
  subtitle,
  headerVariant = "default",
  errorMessage,
  isAuthChecking,
  isAuthorized = true,
  actions,
  children,
}: Props) {
  const contentTopMargin = headerVariant === "hero" ? "mt-6" : "mt-10";

  return (
    <>
      {headerVariant === "hero" ? (
        <section className="rounded-hero bg-primary px-6 py-12 text-center sm:px-10 sm:py-14">
          <h1 className="sk-heading-1 text-white">{title}</h1>
          {subtitle ? (
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-lg">{subtitle}</p>
          ) : null}
          {actions ? <div className="mt-6 flex justify-center">{actions}</div> : null}
        </section>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="sk-page-title">{title}</h1>
            {subtitle ? <p className="mt-3 sk-body-lg">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      )}

      {errorMessage && (
        <div className="mt-6 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isAuthChecking && (
        <div className="sk-empty-state mt-6">Checking admin access...</div>
      )}

      <div className={`${contentTopMargin} ${!isAuthorized ? "pointer-events-none opacity-60" : ""}`}>
        {children}
      </div>
    </>
  );
}
