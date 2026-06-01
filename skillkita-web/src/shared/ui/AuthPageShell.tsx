import type { ReactNode } from "react";
import SiteHeader from "../../app/layout/SiteHeader";

type Props = {
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: ReactNode;
};

export function AuthPageShell({ title, subtitle, wide = false, children }: Props) {
  return (
    <div className="min-h-screen w-full bg-paper">
      <SiteHeader />
      <main className="sk-page-container flex justify-center py-10 sm:py-12">
        <div className={`w-full ${wide ? "max-w-xl" : "max-w-md"}`}>
          <section className="rounded-hero bg-primary px-6 py-10 text-center sm:py-12">
            <h1 className="sk-heading-2 text-white">{title}</h1>
            {subtitle ? <p className="mt-2 text-sm text-white/90 sm:text-base">{subtitle}</p> : null}
          </section>
          <div className="sk-card mt-6 p-6 md:p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
