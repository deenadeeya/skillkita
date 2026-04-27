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
          <h1 className="text-4xl font-bold text-[#0001fc] md:text-5xl">{title}</h1>
          {subtitle && <p className="mt-3 text-lg text-black md:text-xl">{subtitle}</p>}
        </div>
        {actions}
      </div>

      {errorMessage && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {isAuthChecking && (
        <div className="mt-6 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
          Checking admin access...
        </div>
      )}

      <div className={`mt-10 ${!isAuthorized ? "opacity-60 pointer-events-none" : ""}`}>
        {children}
      </div>
    </>
  );
}

