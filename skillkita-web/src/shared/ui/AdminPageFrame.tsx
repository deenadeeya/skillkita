import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  errorMessage?: string | null;
  isAuthChecking?: boolean;
  isAuthorized?: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageFrame({
  title,
  subtitle,
  errorMessage,
  isAuthChecking,
  isAuthorized = true,
  actions,
  children,
}: Props) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="sk-page-title">{title}</h1>
          {subtitle ? <p className="mt-3 sk-body-lg">{subtitle}</p> : null}
        </div>
        {actions}
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-card border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isAuthChecking && (
        <div className="sk-empty-state mt-6">Checking admin access...</div>
      )}

      <div className={`mt-10 ${!isAuthorized ? "pointer-events-none opacity-60" : ""}`}>
        {children}
      </div>
    </>
  );
}
