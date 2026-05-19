import { PhoneIcon } from "@heroicons/react/24/solid";
import type { LandingContentRow } from "../api/landingApi";
import { sanitizeMapEmbedUrl } from "../aboutUsMap";

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

type Props = {
  landing: LandingContentRow | null;
  isLoading: boolean;
};

export function AboutUsPublicSections({ landing, isLoading }: Props) {
  const profileParagraphs = splitParagraphs(landing?.who_description ?? "");
  const locationParagraphs = splitParagraphs(landing?.location_description ?? "");
  const bankParagraphs = splitParagraphs(landing?.bank_account_details ?? "");
  const mapSrc = sanitizeMapEmbedUrl(landing?.location_map_embed_url);

  const contacts = [
    { name: landing?.contact_1_name, phone: landing?.contact_1_phone },
    { name: landing?.contact_2_name, phone: landing?.contact_2_phone },
  ].filter((c) => c.name?.trim() || c.phone?.trim());

  if (isLoading) {
    return (
      <p className="mt-8 rounded-xl border border-dashed border-[#c5b5ad] bg-white/60 p-6 text-sm text-black">
        Loading content...
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-8 max-w-3xl">
      {/* 1. Company Profile */}
      <section className="sk-card overflow-hidden">
        <div className="border-b border-[#efe1db] px-5 py-4 md:px-6">
          <h2 className="text-xl font-bold text-[#7A1F1F] md:text-2xl">Company Profile</h2>
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
          <h2 className="text-xl font-bold text-[#7A1F1F] md:text-2xl">Location</h2>
        </div>
        <div className="px-5 py-5 md:px-6 md:py-6">
          {locationParagraphs.length === 0 && !mapSrc ? (
            <p className="text-sm text-black/70">Location details will appear here once added by admin.</p>
          ) : (
            <>
              {locationParagraphs.map((p) => (
                <p key={p.slice(0, 40)} className="mt-3 text-base text-black first:mt-0 md:text-lg">
                  {p}
                </p>
              ))}
              {mapSrc && (
                <div className="mt-5 overflow-hidden rounded-xl border border-[#efe1db] bg-[#f5f1e8]">
                  <iframe
                    title="Company location on Google Maps"
                    src={mapSrc}
                    className="aspect-[16/10] w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 3. Bank Account */}
      <section className="sk-card overflow-hidden">
        <div className="border-b border-[#efe1db] px-5 py-4 md:px-6">
          <h2 className="text-xl font-bold text-[#7A1F1F] md:text-2xl">Bank Account Details</h2>
        </div>
        <div className="px-5 py-5 md:px-6 md:py-6">
          {bankParagraphs.length === 0 && !landing?.bank_qr_image_url ? (
            <p className="text-sm text-black/70">Bank account information will appear here once added by admin.</p>
          ) : (
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {bankParagraphs.length > 0 && (
                <div className="flex-1 whitespace-pre-line text-base text-black md:text-lg">
                  {bankParagraphs.map((p) => (
                    <p key={p.slice(0, 40)} className="mt-3 first:mt-0">
                      {p}
                    </p>
                  ))}
                </div>
              )}
              {landing?.bank_qr_image_url && (
                <div className="shrink-0 text-center">
                  <img
                    src={landing.bank_qr_image_url}
                    alt="Payment QR code"
                    className="mx-auto max-h-56 w-auto max-w-[220px] rounded-xl border border-[#efe1db] bg-white p-2 object-contain"
                    loading="lazy"
                  />
                  <p className="mt-2 text-xs font-semibold text-[#7A1F1F]">Scan to pay</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. Contact */}
      <section className="sk-card overflow-hidden">
        <div className="border-b border-[#efe1db] px-5 py-4 md:px-6">
          <h2 className="text-xl font-bold text-[#7A1F1F] md:text-2xl">Contact Details</h2>
        </div>
        <div className="px-5 py-5 md:px-6 md:py-6">
          {contacts.length === 0 ? (
            <p className="text-sm text-black/70">Contact details will appear here once added by admin.</p>
          ) : (
            <ul className="space-y-4">
              {contacts.map((c, idx) => (
                <li
                  key={`${c.name ?? "contact"}-${idx}`}
                  className="flex items-start gap-3 rounded-xl border border-[#efe1db] bg-[#f9f5ed] px-4 py-3"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#7A1F1F]/10">
                    <PhoneIcon className="h-5 w-5 text-[#7A1F1F]" aria-hidden />
                  </span>
                  <div>
                    {c.name?.trim() && (
                      <p className="font-semibold text-[#0001fc]">{c.name.trim()}</p>
                    )}
                    {c.phone?.trim() && (
                      <a
                        href={`tel:${c.phone.trim().replace(/\s/g, "")}`}
                        className="mt-0.5 block text-base font-medium text-[#7A1F1F] hover:underline"
                      >
                        {c.phone.trim()}
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
