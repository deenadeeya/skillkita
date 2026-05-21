import {
  BuildingLibraryIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  QrCodeIcon,
} from "@heroicons/react/24/solid";
import type { LandingContentRow } from "../api/landingApi";
import { sanitizeMapEmbedUrl } from "../aboutUsMap";
import {
  BANK_DETAIL_LABELS,
  formatLocationForDisplay,
  multilineToDisplayLines,
} from "../formatLocationDisplay";

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

type ContactEntry = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
};

type Props = {
  landing: LandingContentRow | null;
  isLoading: boolean;
};

export function AboutUsPublicSections({ landing, isLoading }: Props) {
  const profileParagraphs = splitParagraphs(landing?.who_description ?? "");
  const locationRaw = (landing?.location_description ?? "").trim();
  const locationText = formatLocationForDisplay(locationRaw);
  const bankRaw = (landing?.bank_account_details ?? "").trim();
  const bankLines = multilineToDisplayLines(bankRaw);
  const bankQrUrl = landing?.bank_qr_image_url?.trim() ?? "";
  const mapSrc = sanitizeMapEmbedUrl(landing?.location_map_embed_url);

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
      <p className="mt-8 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
        Loading content...
      </p>
    );
  }

  return (
    <div className="mt-8 max-w-4xl space-y-8">
      {/* 1. Company Profile */}
      <section className="sk-card overflow-hidden">
        <div className="border-b border-[#efe1db] px-5 py-4 md:px-6">
          <h2 className="text-xl font-bold text-[#7A1F1F] md:text-2xl">1. Company Profile</h2>
        </div>
        {landing?.who_image_url && (
          <img
            src={landing.who_image_url}
            alt="Company"
            className="h-48 w-full object-cover md:h-64"
            loading="lazy"
          />
        )}
        <div className="px-5 py-5 md:px-6 md:py-6">
          {profileParagraphs.length === 0 ? (
            <p className="text-sm text-black/70">Company description will appear here once added by admin.</p>
          ) : (
            profileParagraphs.map((p) => (
              <p key={p.slice(0, 40)} className="mt-3 text-base text-black first:mt-0 md:text-lg">
                {p}
              </p>
            ))
          )}
        </div>
      </section>

      {/* 2. Location */}
      <section className="sk-card overflow-hidden">
        <div className="border-b border-[#efe1db] px-5 py-4 md:px-6">
          <h2 className="text-xl font-bold text-[#7A1F1F] md:text-2xl">2. Location</h2>
        </div>
        <div className="px-5 py-5 md:px-6 md:py-6">
          {!locationText && !mapSrc ? (
            <p className="text-sm text-black/70">Location details will appear here once added by admin.</p>
          ) : (
            <div className={mapSrc && locationText ? "grid gap-6 lg:grid-cols-2 lg:items-start" : ""}>
              {locationText && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7A1F1F]/80">
                    Location details
                  </h3>
                  <div className="mt-3 flex gap-3 rounded-2xl border border-[#e8d9cf] bg-gradient-to-br from-white via-[#fdfbf7] to-[#f5efe6] p-4 shadow-sm md:p-5">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7A1F1F]/10"
                      aria-hidden
                    >
                      <MapPinIcon className="h-6 w-6 text-[#7A1F1F]" />
                    </span>
                    <address className="not-italic whitespace-pre-line text-base leading-relaxed text-black/90 md:text-lg">
                      {locationText}
                    </address>
                  </div>
                </div>
              )}
              {mapSrc && (
                <div className={locationText ? "" : "max-w-3xl"}>
                  {locationText && (
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#7A1F1F]/80 lg:sr-only">
                      Map
                    </h3>
                  )}
                  <div className="overflow-hidden rounded-2xl border border-[#e8d9cf] bg-[#f5f1e8] shadow-sm ring-1 ring-black/5">
                    <iframe
                      title="Company location on Google Maps"
                      src={mapSrc}
                      className="aspect-[4/3] w-full border-0 lg:aspect-[16/11]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. Bank Account */}
      <section className="sk-card overflow-hidden">
        <div className="border-b border-[#efe1db] px-5 py-4 md:px-6">
          <h2 className="text-xl font-bold text-[#7A1F1F] md:text-2xl">3. Bank Account Details</h2>
        </div>
        <div className="px-5 py-5 md:px-6 md:py-6">
          {bankLines.length === 0 && !bankQrUrl ? (
            <p className="text-sm text-black/70">Bank account information will appear here once added by admin.</p>
          ) : (
            <div
              className={
                bankLines.length > 0 && bankQrUrl
                  ? "grid gap-6 lg:grid-cols-[1fr_auto] lg:items-stretch"
                  : "flex flex-col gap-6"
              }
            >
              {bankLines.length > 0 && (
                <div className="rounded-2xl border border-[#e8d9cf] bg-gradient-to-br from-white via-[#fdfbf7] to-[#f5efe6] p-5 shadow-sm md:p-6">
                  <div className="flex items-center gap-3 border-b border-[#efe1db] pb-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7A1F1F]/10">
                      <BuildingLibraryIcon className="h-6 w-6 text-[#7A1F1F]" aria-hidden />
                    </span>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7A1F1F]">
                      Payment information
                    </h3>
                  </div>
                  <dl className="mt-4 space-y-4">
                    {bankLines.map((line, idx) => {
                      const label = BANK_DETAIL_LABELS[idx] ?? `Details ${idx + 1}`;
                      const isAccountNumber = idx === 2 || /^\d[\d\s-]+$/.test(line);
                      return (
                        <div key={`${idx}-${line.slice(0, 24)}`}>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-black/50">
                            {label}
                          </dt>
                          <dd
                            className={
                              isAccountNumber
                                ? "mt-1 font-mono text-lg font-semibold tracking-wide text-[#0001fc] md:text-xl"
                                : "mt-1 text-base font-semibold text-black/90 md:text-lg"
                            }
                          >
                            {line}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </div>
              )}
              {bankQrUrl && (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e8d9cf] bg-gradient-to-b from-[#f9f5ed] to-white p-5 shadow-sm lg:min-w-[240px]">
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#7A1F1F]">
                    <QrCodeIcon className="h-4 w-4" aria-hidden />
                    Scan to pay
                  </p>
                  <div className="mt-4 rounded-xl border-2 border-dashed border-[#d8c9c2] bg-white p-3 shadow-inner">
                    <img
                      src={bankQrUrl}
                      alt="Payment QR code"
                      className="mx-auto h-auto w-full max-w-[200px] object-contain"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-3 max-w-[12rem] text-center text-xs leading-relaxed text-black/60">
                    Use your banking app to scan and transfer
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. Contact */}
      <section className="sk-card overflow-hidden">
        <div className="border-b border-[#efe1db] px-5 py-4 md:px-6">
          <h2 className="text-xl font-bold text-[#7A1F1F] md:text-2xl">4. Contact Details</h2>
        </div>
        <div className="px-5 py-5 md:px-6 md:py-6">
          {!hasContactContent ? (
            <p className="text-sm text-black/70">Contact details will appear here once added by admin.</p>
          ) : (
            <>
              {companyHrEmail && (
                <div className="mb-5 rounded-2xl border border-[#e8d9cf] bg-gradient-to-br from-[#f8f7ff] to-[#f9f5ed] p-4 shadow-sm md:max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#7A1F1F]/80">
                    Company Email
                  </p>
                  <a
                    href={`mailto:${companyHrEmail}`}
                    className="mt-2 flex items-center gap-2.5 text-base font-semibold text-[#7A1F1F] transition hover:text-[#5a1818] hover:underline"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7A1F1F]/10">
                      <EnvelopeIcon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="break-all">{companyHrEmail}</span>
                  </a>
                </div>
              )}
            {contacts.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {contacts.map((c, idx) => (
                <li
                  key={`${c.name ?? "contact"}-${idx}`}
                  className="flex flex-col gap-3 rounded-2xl border border-[#e8d9cf] bg-gradient-to-br from-white to-[#f9f5ed] p-4 shadow-sm"
                >
                  {c.name?.trim() && (
                    <p className="text-lg font-bold text-[#0001fc]">{c.name.trim()}</p>
                  )}
                  <div className="space-y-2.5">
                    {c.phone?.trim() && (
                      <a
                        href={`tel:${c.phone.trim().replace(/\s/g, "")}`}
                        className="flex items-center gap-2.5 text-sm font-medium text-[#7A1F1F] transition hover:text-[#5a1818] hover:underline"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7A1F1F]/10">
                          <PhoneIcon className="h-4 w-4" aria-hidden />
                        </span>
                        {c.phone.trim()}
                      </a>
                    )}
                    {c.email?.trim() && (
                      <a
                        href={`mailto:${c.email.trim()}`}
                        className="flex items-center gap-2.5 text-sm font-medium text-[#7A1F1F] transition hover:text-[#5a1818] hover:underline"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#7A1F1F]/10">
                          <EnvelopeIcon className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="break-all">{c.email.trim()}</span>
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
