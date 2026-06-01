const LINKS = [
  { href: "#site-media", label: "Site images" },
  { href: "#home-content", label: "Social profiles" },
  { href: "#about-us-content", label: "About Us" },
  { href: "#homepage-cms", label: "Homepage CMS" },
] as const;

export function AdminLandingSectionNav() {
  return (
    <nav
      className="sk-card flex flex-wrap gap-2 p-3 md:p-4"
      aria-label="Landing page sections"
    >
      {LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}
