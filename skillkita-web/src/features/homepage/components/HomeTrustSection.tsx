import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  CheckBadgeIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const TRUST_ITEMS = [
  {
    icon: CheckBadgeIcon,
    title: "Accredited",
    description: "Recognised TVET programmes meeting national quality standards.",
  },
  {
    icon: BuildingOffice2Icon,
    title: "Industry Recognised",
    description: "Training aligned with employer needs and sector requirements.",
  },
  {
    icon: AcademicCapIcon,
    title: "HRD Corp Claimable",
    description: "Eligible courses for HRD Corp levy claimable training.",
  },
  {
    icon: WrenchScrewdriverIcon,
    title: "Practical Training",
    description: "Hands-on workshops with real equipment and industry scenarios.",
  },
] as const;

export function HomeTrustSection() {
  return (
    <section className="mt-8 sm:mt-12">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TRUST_ITEMS.map((item) => (
          <article
            key={item.title}
            className="sk-card group p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
              <item.icon className="h-6 w-6" aria-hidden />
            </div>
            <h3 className="mt-4 font-heading text-lg font-semibold text-ink">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
