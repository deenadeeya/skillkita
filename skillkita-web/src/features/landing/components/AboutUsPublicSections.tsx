import {
  BuildingLibraryIcon,
  EnvelopeIcon,
  PhoneIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { CoursePosterMedia } from "../../courses/components/CoursePosterMedia";
import { HomeCtaBanner } from "../../homepage/components/HomeCtaBanner";
import type { ExperienceRow, LandingContentRow } from "../api/landingApi";
import { AboutUsLocationHero } from "./AboutUsLocationHero";
import { CompanyExperienceSlideshow } from "./CompanyExperienceSlideshow";
import { sanitizeGoogleMapsLink } from "../aboutUsMap";
import {
  BANK_DETAIL_LABELS,
  formatMultilineForDisplay,
  multilineToDisplayLines,
} from "../formatLocationDisplay";

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** First paragraph = short intro; rest (or all) = address for the location hero. */
function splitLocationContent(text: string): { shortDescription: string; address: string } {
  const paragraphs = splitParagraphs(text);
  if (paragraphs.length >= 2) {
    return {
      shortDescription: paragraphs[0]!,
      address: paragraphs.slice(1).join("\n\n"),
    };
  }
  return {
    shortDescription: "",
    address: formatMultilineForDisplay(text),
  };
}

type ContactEntry = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
};

type Props = {
  landing: LandingContentRow | null;
  experiences: ExperienceRow[];
  isLoading: boolean;
};

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center">
      <h2 className="sk-heading-2 text-ink">{title}</h2>
      {subtitle ? (
        <p className="mx-auto mt-3 max-w-2xl text-ink-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}

function IconTile({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof PhoneIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="sk-card group flex h-full flex-col p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition duration-200 group-hover:bg-primary group-hover:text-white">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <h3 className="mt-4 font-heading text-lg font-semibold text-ink">{title}</h3>
      <div className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted md:text-base">{children}</div>
    </article>
  );
}

export function AboutUsPublicSections({ landing, experiences, isLoading }: Props) {
  const profileParagraphs = splitParagraphs(landing?.who_description ?? "");
  const profileImage = landing?.who_image_url?.trim() || "/TRSCGroupPhoto.jpg";
  const locationRaw = (landing?.location_description ?? "").trim();
  const { shortDescription: locationShortDescription, address: locationAddress } =
    splitLocationContent(locationRaw);
  const locationBuildingImage =
    landing?.home_featured_3_url?.trim() ||
    landing?.who_image_url?.trim() ||
    profileImage;
  const bankRaw = (landing?.bank_account_details ?? "").trim();
  const bankLines = multilineToDisplayLines(bankRaw);
  const bankQrUrl = landing?.bank_qr_image_url?.trim() ?? "";
  const mapsLink = sanitizeGoogleMapsLink(landing?.location_map_embed_url);

  const contacts: ContactEntry[] = [
    {
      name: landing?.contact_1_name,
      phone: landing?.contact_1_phone,
      email: landing?.contact_1_email,
    },
    {
      name: landing?.contact_2_name,
      phone: landing?.contact_2_phone,
      email: landing?.contact_2_email,
    },
  ].filter((c) => c.name?.trim() || c.phone?.trim() || c.email?.trim());

  const companyHrEmail = landing?.company_hr_email?.trim() ?? "";
  const hasContactContent = contacts.length > 0 || Boolean(companyHrEmail);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="h-48 animate-pulse rounded-hero bg-primary/20" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="sk-card h-64 animate-pulse" />
          <div className="sk-card h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-8">
      {/* Page hero — matches homepage maroon banner tone */}
      <section className="rounded-hero bg-primary px-6 py-12 text-center sm:px-10 sm:py-14">
        <h1 className="sk-heading-1 text-white">About Us</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
          Company profile, location, payment details, and contacts for Tawau Resources &amp; Skills
          Centre.
        </p>
      </section>

      {/* Company profile — same layout as homepage “Why Choose TRSC” */}
      <section className="mt-16 sm:mt-20">
        <SectionHeader
          title="Who We Are"
          subtitle="A Bumiputera training provider committed to accredited skills development."
        />
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="overflow-hidden rounded-hero shadow-card">
            <CoursePosterMedia
              url={profileImage}
              alt="TRSC team and training facilities"
              className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
              optimizeWidth={800}
            />
          </div>
          <div>
            {profileParagraphs.length === 0 ? (
              <p className="text-ink-muted">
                Company description will appear here once added by admin.
              </p>
            ) : (
              <div className="space-y-4 whitespace-pre-line text-ink-muted md:text-lg">
                {profileParagraphs.map((p) => (
                  <p key={p.slice(0, 40)}>{p}</p>
                ))}
              </div>
            )}
            <a href="/courses" className="sk-button-primary mt-8">
              Browse our courses
            </a>
          </div>
        </div>
      </section>

      <CompanyExperienceSlideshow experiences={experiences} />

      <AboutUsLocationHero
        imageUrl={locationBuildingImage}
        shortDescription={locationShortDescription}
        address={locationAddress}
        mapsLink={mapsLink}
      />

      {/* Bank */}
      <section className="mt-16 sm:mt-20">
        <SectionHeader
          title="Payment Details"
          subtitle="Bank transfer information for course fees and registrations."
        />
        {bankLines.length === 0 && !bankQrUrl ? (
          <p className="mx-auto mt-10 max-w-3xl rounded-hero border border-dashed border-primary/20 bg-white p-10 text-center text-ink-muted">
            Bank account information will appear here once added by admin.
          </p>
        ) : (
          <div className="mx-auto mt-10 grid max-w-3xl gap-6 lg:grid-cols-2 lg:items-stretch">
            {bankLines.length > 0 && (
              <article className="sk-card p-6 md:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BuildingLibraryIcon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-ink">Payment information</h3>
                <dl className="mt-6 space-y-5">
                  {bankLines.map((line, idx) => {
                    const label = BANK_DETAIL_LABELS[idx] ?? `Details ${idx + 1}`;
                    const isAccountNumber = idx === 2 || /^\d[\d\s-]+$/.test(line);
                    return (
                      <div key={`${idx}-${line.slice(0, 24)}`}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          {label}
                        </dt>
                        <dd
                          className={
                            isAccountNumber
                              ? "mt-1 font-mono text-xl font-bold text-secondary md:text-2xl"
                              : "mt-1 text-base font-semibold text-ink"
                          }
                        >
                          {line}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </article>
            )}
            {bankQrUrl && (
              <article className="sk-card flex flex-col items-center justify-center p-6 text-center md:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <QrCodeIcon className="h-6 w-6" aria-hidden />
                </div>
                <h3 className="mt-4 font-heading text-lg font-semibold text-ink">Scan to pay</h3>
                <div className="mt-6 rounded-card border-2 border-dashed border-primary/15 bg-paper p-4">
                  <img
                    src={bankQrUrl}
                    alt="Payment QR code"
                    className="mx-auto max-h-[200px] w-full max-w-[200px] object-contain"
                    loading="lazy"
                  />
                </div>
                <p className="mt-4 text-sm text-ink-muted">
                  Use your banking app to scan and transfer
                </p>
              </article>
            )}
          </div>
        )}
      </section>

      {/* Contact */}
      <section className="mt-16 sm:mt-20">
        <SectionHeader
          title="Get In Touch"
          subtitle="Reach our team for course enquiries and registrations."
        />
        {!hasContactContent ? (
          <p className="mx-auto mt-10 max-w-3xl rounded-hero border border-dashed border-primary/20 bg-white p-10 text-center text-ink-muted">
            Contact details will appear here once added by admin.
          </p>
        ) : (
          <div className="mx-auto mt-10 max-w-3xl space-y-6">
            {companyHrEmail && (
              <article className="sk-card group p-6 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg md:p-8">
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-white">
                    <EnvelopeIcon className="h-7 w-7" aria-hidden />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                      Company email
                    </p>
                    <a
                      href={`mailto:${companyHrEmail}`}
                      className="mt-1 block break-all font-heading text-lg font-semibold text-primary transition hover:text-primary-dark md:text-xl"
                    >
                      {companyHrEmail}
                    </a>
                  </div>
                </div>
              </article>
            )}
            {contacts.length > 0 && (
              <ul className="grid gap-4 sm:grid-cols-2">
                {contacts.map((c, idx) => (
                  <li key={`${c.name ?? "contact"}-${idx}`}>
                    <IconTile icon={PhoneIcon} title={c.name?.trim() || "Contact"}>
                      <div className="space-y-3">
                        {c.phone?.trim() && (
                          <a
                            href={`tel:${c.phone.trim().replace(/\s/g, "")}`}
                            className="flex items-center gap-2 font-medium text-primary transition hover:text-primary-dark"
                          >
                            <PhoneIcon className="h-4 w-4 shrink-0" aria-hidden />
                            {c.phone.trim()}
                          </a>
                        )}
                        {c.email?.trim() && (
                          <a
                            href={`mailto:${c.email.trim()}`}
                            className="flex items-center gap-2 break-all font-medium text-primary transition hover:text-primary-dark"
                          >
                            <EnvelopeIcon className="h-4 w-4 shrink-0" aria-hidden />
                            {c.email.trim()}
                          </a>
                        )}
                      </div>
                    </IconTile>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      <HomeCtaBanner />
    </div>
  );
}
