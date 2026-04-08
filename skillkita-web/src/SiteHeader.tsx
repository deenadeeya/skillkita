import { useState } from "react";
import TRSCLogo from "./assets/TRSCLogo.png";

type HeaderLink = {
  label: string;
  href: string;
};

type SiteHeaderProps = {
  menuLinks: HeaderLink[];
};

const SiteHeader = ({ menuLinks }: SiteHeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full bg-[#7A1F1F] px-3 py-3 text-white md:px-5">
      <div className="relative mx-auto flex w-full items-center justify-between">
        <a href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-[#7A1F1F]">
            <img
              src={TRSCLogo}
              alt="TRSC logo"
              className="w-full max-w-md rounded-xl"
            />
          </div>
          <span className="text-sm font-semibold md:text-base">
            Tawau Resources & Skills Centre
          </span>
        </a>

        <button
          type="button"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-white/30 bg-white/10"
        >
          <span className="sr-only">Menu</span>
          <span className="flex flex-col gap-1.5">
            <span className="h-0.5 w-5 bg-white" />
            <span className="h-0.5 w-5 bg-white" />
            <span className="h-0.5 w-5 bg-white" />
          </span>
        </button>

        {isMenuOpen && (
          <nav className="absolute right-0 top-14 w-56 rounded-lg bg-white p-2 text-[#7A1F1F] shadow-lg">
            {menuLinks.map((link) => (
              <a
                key={`${link.label}-${link.href}`}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-[#F5F1E8]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default SiteHeader;