import type { ChangeEvent } from "react";

import { MediaUploadField } from "./MediaUploadField";

type FeaturedSlot = 3;

type Props = {
  heroPreviewUrl: string;
  whoPreviewUrl: string;
  locationBuildingPreviewUrl: string;
  bankQrPreviewUrl: string;
  isSaving: boolean;
  onHeroImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onWhoImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLocationBuildingImageChange: (slot: FeaturedSlot, event: ChangeEvent<HTMLInputElement>) => void;
  onBankQrImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export function SiteMediaEditor({
  heroPreviewUrl,
  whoPreviewUrl,
  locationBuildingPreviewUrl,
  bankQrPreviewUrl,
  isSaving,
  onHeroImageChange,
  onWhoImageChange,
  onLocationBuildingImageChange,
  onBankQrImageChange,
}: Props) {
  return (
    <section id="site-media" className="sk-card scroll-mt-24 p-6 md:p-8">
      <div className="border-b border-black/5 pb-5">
        <h2 className="sk-section-title">Site images</h2>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          Photos used on the public <strong className="font-medium text-ink">Home</strong> and{" "}
          <strong className="font-medium text-ink">About Us</strong> pages. Partner logos are managed
          in Homepage CMS below.
        </p>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold uppercase tracking-wide text-primary">Home page</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MediaUploadField
            id="media-home-hero"
            label="Hero background"
            hint="Full-width image behind the homepage headline. Recommended 1920 × 900 px."
            previewUrl={heroPreviewUrl}
            previewAlt="Homepage hero preview"
            previewClassName="mt-3 max-h-48 w-full rounded-hero object-cover"
            isSaving={isSaving}
            onImageChange={onHeroImageChange}
          />
          <MediaUploadField
            id="media-who"
            label="Why choose us — photo"
            hint="Shown in the “Why choose TRSC SkillKita” section on the home page and as the company profile on About Us."
            previewUrl={whoPreviewUrl}
            previewAlt="Why choose us preview"
            isSaving={isSaving}
            onImageChange={onWhoImageChange}
          />
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-sm font-bold uppercase tracking-wide text-primary">About Us page</h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <MediaUploadField
            id="media-location-building"
            label="Location — building photo"
            hint="Wide image on the About Us location section. Falls back to the company profile photo if empty."
            previewUrl={locationBuildingPreviewUrl}
            previewAlt="Location building preview"
            previewClassName="mt-3 aspect-[16/7] w-full rounded-hero object-cover"
            isSaving={isSaving}
            onImageChange={(e) => onLocationBuildingImageChange(3, e)}
          />
          <MediaUploadField
            id="media-bank-qr"
            label="Payment — QR code"
            hint="QR image shown with bank account details on About Us."
            previewUrl={bankQrPreviewUrl}
            previewAlt="Bank QR preview"
            previewClassName="mt-3 mx-auto max-h-44 max-w-[200px] rounded-card border border-black/10 bg-white p-2 object-contain"
            isSaving={isSaving}
            onImageChange={onBankQrImageChange}
          />
        </div>
      </div>
    </section>
  );
}
