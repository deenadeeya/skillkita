type Props = {
  title: string;
  subtitle?: string;
  className?: string;
};

export function DashboardPageHeader({ title, subtitle, className = "" }: Props) {
  return (
    <header
      className={`rounded-hero bg-primary px-6 py-10 text-center sm:px-10 sm:py-12 ${className}`}
    >
      <h1 className="sk-heading-2 text-white">{title}</h1>
      {subtitle ? (
        <p className="mx-auto mt-3 max-w-2xl text-base text-white/90 sm:text-lg">{subtitle}</p>
      ) : null}
    </header>
  );
}
