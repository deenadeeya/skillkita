import { useEffect, useMemo, useState } from "react";
import { getLandingContent } from "../../features/landing/api/landingApi";
import { useDashboardMainInset } from "./DashboardMainInsetContext";

const FOOTER_LINKS = {
  company: [
    { label: "About Us", href: "/about-us" },
    { label: "Company Experience", href: "/company-experience" },
  ],
  courses: [
    { label: "Browse Courses", href: "/courses" },
  ],
  contact: [
    { label: "Address", href: "/about-us" },
    { label: "Email", href: "/about-us" },
    { label: "Phone", href: "/about-us" },
  ],
} as const;

type SocialLink = {
  label: string;
  href: string;
};

const SiteFooter = () => {
  const { desktopInsetPx } = useDashboardMainInset();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => {
    const loadSocialLinks = async () => {
      try {
        const row = await getLandingContent(1);
        const links: SocialLink[] = [];

        const facebook = row?.social_facebook_page_url?.trim();
        const instagram = row?.social_instagram_profile_url?.trim();
        const linkedin = row?.social_linkedin_profile_url?.trim();

        if (facebook) links.push({ label: "Facebook", href: facebook });
        if (instagram) links.push({ label: "Instagram", href: instagram });
        if (linkedin) links.push({ label: "LinkedIn", href: linkedin });

        setSocialLinks(links);
      } catch {
        setSocialLinks([]);
      }
    };

    void loadSocialLinks();
  }, []);

  const showSocialColumn = useMemo(() => socialLinks.length > 0, [socialLinks.length]);

  return (
    <footer className="w-full border-t border-white/10 bg-primary text-white">
      <div className={desktopInsetPx > 0 ? "w-full lg:pl-[220px]" : "w-full"}>
        <div className="sk-container py-6">
          <div
            className={`grid gap-6 sm:grid-cols-2 ${showSocialColumn ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
          >
            <div>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-secondary">
                Company
              </h3>
              <ul className="mt-2 space-y-1">
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
              <ul className="mt-2 space-y-1">
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
              <ul className="mt-2 space-y-1">
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

            {showSocialColumn && (
              <div>
                <h3 className="font-heading text-sm font-semibold uppercase tracking-wide text-secondary">
                  Social Media
                </h3>
                <ul className="mt-2 space-y-1">
                  {socialLinks.map((link) => (
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
            )}
          </div>

          <div className="mt-6 border-t border-white/15 pt-4 text-center text-sm text-white/80">
            <p className="font-semibold text-white">Tawau Resources and Skills Centre SkillKita</p>
            <p className="mt-1">SkillKita is a Final Year Project done by Nadeeya Azizee (2026)</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
