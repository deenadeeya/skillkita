import { useDashboardMainInset } from "./DashboardMainInsetContext";

const FOOTER_LINKS = {
  company: [
    { label: "About Us", href: "/about-us" },
    { label: "Company Experience", href: "/company-experience" },
  ],
  courses: [
    { label: "Browse Courses", href: "/courses" },
    { label: "Popular Courses", href: "/courses" },
  ],
  contact: [
    { label: "Phone", href: "/about-us" },
    { label: "Email", href: "/about-us" },
    { label: "Address", href: "/about-us" },
  ],
  social: [
    { label: "Facebook", href: "https://facebook.com", external: true },
    { label: "Instagram", href: "https://instagram.com", external: true },
    { label: "LinkedIn", href: "https://linkedin.com", external: true },
  ],
} as const;

const SiteFooter = () => {
  const year = new Date().getFullYear();
  const { desktopInsetPx } = useDashboardMainInset();

  return (
    <footer className="w-full border-t border-white/10 bg-primary text-white">
      <div className={desktopInsetPx > 0 ? "w-full lg:pl-[220px]" : "w-full"}>
        <div className="sk-container py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-secondary">
                Company
              </h3>
              <ul className="mt-4 space-y-2">
                {FOOTER_LINKS.company.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/85 transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-secondary">
                Courses
              </h3>
              <ul className="mt-4 space-y-2">
                {FOOTER_LINKS.courses.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/85 transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-secondary">
                Contact
              </h3>
              <ul className="mt-4 space-y-2">
                {FOOTER_LINKS.contact.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-white/85 transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-secondary">
                Social Media
              </h3>
              <ul className="mt-4 space-y-2">
                {FOOTER_LINKS.social.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-white/85 transition hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/15 pt-6 text-center text-sm text-white/80">
            <p className="font-semibold text-white">© {year} TRSC SkillKita</p>
            <p className="mt-1">All Rights Reserved</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
