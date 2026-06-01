import { ArrowTopRightOnSquareIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { CoursePosterMedia } from "../../courses/components/CoursePosterMedia";
import { googleMapsSearchLink } from "../aboutUsMap";

const DEFAULT_BUILDING_IMAGE = "/TRSCGroupPhoto.jpg";

const DEFAULT_SHORT_DESCRIPTION =
  "Visit our accredited training centre in Tawau — built for practical workshops, assessments, and industry-ready skills development.";

type Props = {
  imageUrl: string;
  shortDescription: string;
  address: string;
  mapsLink: string | null;
};

export function AboutUsLocationHero({
  imageUrl,
  shortDescription,
  address,
  mapsLink,
}: Props) {
  const buildingImage = imageUrl.trim() || DEFAULT_BUILDING_IMAGE;
  const hasAddress = Boolean(address.trim());
  const openMapsHref = mapsLink ?? (hasAddress ? googleMapsSearchLink(address) : null);

  if (!hasAddress && !openMapsHref) {
    return (
      <section className="mt-16 sm:mt-20">
        <p className="rounded-hero border border-dashed border-primary/20 bg-white p-10 text-center text-ink-muted">
          Location details will appear here once added by admin.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-16 sm:mt-20">
      <div className="relative min-h-[320px] overflow-hidden rounded-hero bg-ink sm:min-h-[360px] lg:min-h-[420px]">
        <CoursePosterMedia
          url={buildingImage}
          alt="TRSC training centre building"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          optimizeWidth={1200}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/35" />

        <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-center px-6 py-10 sm:min-h-[360px] sm:px-10 lg:min-h-[420px] lg:max-w-2xl lg:px-12 lg:py-14">
          <h2 className="sk-heading-2 text-white">Our Location</h2>
          <p className="mt-3 text-base leading-relaxed text-white/90 sm:text-lg">
            {shortDescription.trim() || DEFAULT_SHORT_DESCRIPTION}
          </p>
          {hasAddress && (
            <div className="mt-6 flex gap-3 rounded-card bg-white/10 p-4 backdrop-blur-sm">
              <MapPinIcon className="mt-0.5 h-6 w-6 shrink-0 text-secondary" aria-hidden />
              <address className="not-italic whitespace-pre-line text-base font-medium leading-relaxed text-white sm:text-lg">
                {address}
              </address>
            </div>
          )}
          {openMapsHref && (
            <a
              href={openMapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="sk-button-gold mt-6 inline-flex min-h-[44px] w-fit items-center gap-2"
            >
              Open in Google Maps
              <ArrowTopRightOnSquareIcon className="h-5 w-5 shrink-0" aria-hidden />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
