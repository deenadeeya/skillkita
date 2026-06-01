import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import PlaceholderPoster from "../../assets/placeholder.jpg";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { supabase } from "../../shared/api/supabaseClient";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";
import { useViewer } from "../../shared/hooks/useViewer";
import {
  DEFAULT_HERO,
  getHomepageHero,
  upsertHomepageHero,
  type HomepageHeroRow,
} from "../../features/homepage/api/homepageApi";
import { getLandingContent, upsertLandingContent, type LandingContentRow } from "../../features/landing/api/landingApi";
import {
  uploadSiteAssetBankQr,
  uploadSiteAssetHeroImage,
  uploadSiteAssetHomeFeatured,
  uploadSiteAssetWhoImage,
} from "../../features/landing/api/landingStorage";
import { AboutUsContentEditor } from "../../features/landing/components/AboutUsContentEditor";
import { LandingContentEditor } from "../../features/landing/components/LandingContentEditor";
import { AdminLandingSectionNav } from "../../features/landing/components/admin/AdminLandingSectionNav";
import { SiteMediaEditor } from "../../features/landing/components/admin/SiteMediaEditor";
import { HomepageCmsEditors } from "../../features/homepage/components/admin/HomepageCmsEditors";

const AdminLandingEditor = () => {
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const viewerState = useViewer();

  const [landing, setLanding] = useState<LandingContentRow | null>(null);
  const [hero, setHero] = useState<HomepageHeroRow | null>(null);
  const [heroPreviewUrl, setHeroPreviewUrl] = useState<string>(PlaceholderPoster);
  const [heroFile, setHeroFile] = useState<File | null>(null);

  const [whoDescription, setWhoDescription] = useState("");
  const [whoPreviewUrl, setWhoPreviewUrl] = useState<string>(PlaceholderPoster);
  const [whoFile, setWhoFile] = useState<File | null>(null);

  const [locationBuildingPreview, setLocationBuildingPreview] = useState<string>(PlaceholderPoster);
  const [locationBuildingFile, setLocationBuildingFile] = useState<File | null>(null);

  const [socialFacebookPageUrl, setSocialFacebookPageUrl] = useState("");
  const [socialInstagramProfileUrl, setSocialInstagramProfileUrl] = useState("");

  const [locationDescription, setLocationDescription] = useState("");
  const [locationMapEmbedUrl, setLocationMapEmbedUrl] = useState("");
  const [bankAccountDetails, setBankAccountDetails] = useState("");
  const [bankQrPreviewUrl, setBankQrPreviewUrl] = useState<string>(PlaceholderPoster);
  const [bankQrFile, setBankQrFile] = useState<File | null>(null);
  const [contact1Name, setContact1Name] = useState("");
  const [contact1Phone, setContact1Phone] = useState("");
  const [contact1Email, setContact1Email] = useState("");
  const [contact2Name, setContact2Name] = useState("");
  const [contact2Phone, setContact2Phone] = useState("");
  const [contact2Email, setContact2Email] = useState("");
  const [companyHrEmail, setCompanyHrEmail] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (viewerState.kind === "signedIn") {
      setAdminEmail(viewerState.viewer.email);
      setAdminName(viewerState.viewer.fullName || "Admin");
    }
  }, [viewerState]);

  const loadLandingContent = useCallback(async () => {
    const [row, heroRow] = await Promise.all([getLandingContent(1), getHomepageHero()]);

    setHero(heroRow);
    if (heroRow?.hero_image) {
      setHeroPreviewUrl(heroRow.hero_image);
    } else {
      setHeroPreviewUrl(PlaceholderPoster);
    }
    setHeroFile(null);

    if (!row) {
      setLanding(null);
      setWhoDescription("");
      setWhoPreviewUrl(PlaceholderPoster);
      setLocationBuildingPreview(PlaceholderPoster);
      setSocialFacebookPageUrl("");
      setSocialInstagramProfileUrl("");
      setLocationDescription("");
      setLocationMapEmbedUrl("");
      setBankAccountDetails("");
      setBankQrPreviewUrl(PlaceholderPoster);
      setContact1Name("");
      setContact1Phone("");
      setContact1Email("");
      setContact2Name("");
      setContact2Phone("");
      setContact2Email("");
      setCompanyHrEmail("");
      return;
    }

    setLanding(row);
    setWhoDescription(row.who_description ?? "");
    setWhoPreviewUrl(row.who_image_url ?? PlaceholderPoster);
    setLocationBuildingPreview(row.home_featured_3_url ?? PlaceholderPoster);
    setWhoFile(null);
    setLocationBuildingFile(null);
    setSocialFacebookPageUrl(row.social_facebook_page_url ?? "");
    setSocialInstagramProfileUrl(row.social_instagram_profile_url ?? "");
    setLocationDescription(row.location_description ?? "");
    setLocationMapEmbedUrl(row.location_map_embed_url ?? "");
    setBankAccountDetails(row.bank_account_details ?? "");
    setBankQrPreviewUrl(row.bank_qr_image_url ?? PlaceholderPoster);
    setBankQrFile(null);
    setContact1Name(row.contact_1_name ?? "");
    setContact1Phone(row.contact_1_phone ?? "");
    setContact1Email(row.contact_1_email ?? "");
    setContact2Name(row.contact_2_name ?? "");
    setContact2Phone(row.contact_2_phone ?? "");
    setContact2Email(row.contact_2_email ?? "");
    setCompanyHrEmail(row.company_hr_email ?? "");
  }, []);

  const loadAll = useCallback(async () => {
    setErrorMessage(null);
    try {
      await loadLandingContent();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to load content.");
    }
  }, [loadLandingContent]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onHeroImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!file) {
      setHeroFile(null);
      setHeroPreviewUrl(hero?.hero_image ?? PlaceholderPoster);
      return;
    }
    setHeroFile(file);
    setHeroPreviewUrl(URL.createObjectURL(file));
  };

  const onLocationBuildingImageChange = (_slot: 3, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!file) {
      setLocationBuildingFile(null);
      setLocationBuildingPreview(landing?.home_featured_3_url ?? PlaceholderPoster);
      return;
    }
    setLocationBuildingFile(file);
    setLocationBuildingPreview(URL.createObjectURL(file));
  };

  const onWhoImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!file) {
      setWhoFile(null);
      setWhoPreviewUrl(landing?.who_image_url ?? PlaceholderPoster);
      return;
    }
    setWhoFile(file);
    setWhoPreviewUrl(URL.createObjectURL(file));
  };

  const onBankQrImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    if (!file) {
      setBankQrFile(null);
      setBankQrPreviewUrl(landing?.bank_qr_image_url ?? PlaceholderPoster);
      return;
    }
    setBankQrFile(file);
    setBankQrPreviewUrl(URL.createObjectURL(file));
  };

  const saveLanding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const whoUrl = whoFile ? await uploadSiteAssetWhoImage(whoFile) : null;
      const bankQrUrl = bankQrFile ? await uploadSiteAssetBankQr(bankQrFile) : null;
      const locationUrl = locationBuildingFile
        ? await uploadSiteAssetHomeFeatured(locationBuildingFile, 3)
        : null;
      const heroUrl = heroFile ? await uploadSiteAssetHeroImage(heroFile) : null;

      const payload = {
        id: 1,
        cover_description: landing?.cover_description ?? "",
        who_description: whoDescription.trim(),
        who_image_url: whoUrl ?? landing?.who_image_url ?? null,
        home_featured_1_url: landing?.home_featured_1_url ?? null,
        home_featured_2_url: landing?.home_featured_2_url ?? null,
        home_featured_3_url: locationUrl ?? landing?.home_featured_3_url ?? null,
        social_facebook_page_url: socialFacebookPageUrl.trim() || null,
        social_facebook_post_urls: null,
        social_instagram_profile_url: socialInstagramProfileUrl.trim() || null,
        social_instagram_post_url: null,
        location_description: locationDescription.trim() || null,
        location_map_embed_url: locationMapEmbedUrl.trim() || null,
        bank_account_details: bankAccountDetails.trim() || null,
        bank_qr_image_url: bankQrUrl ?? landing?.bank_qr_image_url ?? null,
        contact_1_name: contact1Name.trim() || null,
        contact_1_phone: contact1Phone.trim() || null,
        contact_1_email: contact1Email.trim() || null,
        contact_2_name: contact2Name.trim() || null,
        contact_2_phone: contact2Phone.trim() || null,
        contact_2_email: contact2Email.trim() || null,
        company_hr_email: companyHrEmail.trim() || null,
        updated_at: new Date().toISOString(),
      };

      await upsertLandingContent(payload);

      if (heroUrl) {
        await upsertHomepageHero({
          id: 1,
          title: hero?.title ?? DEFAULT_HERO.title,
          subtitle: DEFAULT_HERO.subtitle,
          hero_image: heroUrl,
          button_1_text: DEFAULT_HERO.button_1_text,
          button_1_link: DEFAULT_HERO.button_1_link,
          button_2_text: DEFAULT_HERO.button_2_text,
          button_2_link: DEFAULT_HERO.button_2_link,
          updated_at: new Date().toISOString(),
        });
      }

      setWhoFile(null);
      setBankQrFile(null);
      setLocationBuildingFile(null);
      setHeroFile(null);
      await loadLandingContent();
      setIsSaving(false);
    } catch (err) {
      setIsSaving(false);
      setErrorMessage(err instanceof Error ? err.message : "Failed to save landing content.");
    }
  };

  return (
    <DashboardLayout
      items={adminNavItems}
      userName={adminName}
      userEmail={adminEmail}
      fullWidth
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
      <AdminPageFrame
        title="Manage Landing Page"
        subtitle="Update site images, About Us content, social profile links, and the corporate homepage (hero headline, statistics, partners)."
        errorMessage={errorMessage}
        isAuthChecking={viewerState.kind === "loading"}
        isAuthorized={viewerState.kind === "signedIn"}
        actions={
          <a href="/" className="sk-button-secondary w-fit no-underline">
            View site
          </a>
        }
      >
        <AdminLandingSectionNav />

        <form className="mt-6 max-w-4xl space-y-6" onSubmit={saveLanding}>
          <SiteMediaEditor
            heroPreviewUrl={heroPreviewUrl}
            whoPreviewUrl={whoPreviewUrl}
            locationBuildingPreviewUrl={locationBuildingPreview}
            bankQrPreviewUrl={bankQrPreviewUrl}
            isSaving={isSaving}
            onHeroImageChange={onHeroImageChange}
            onWhoImageChange={onWhoImageChange}
            onLocationBuildingImageChange={onLocationBuildingImageChange}
            onBankQrImageChange={onBankQrImageChange}
          />

          <LandingContentEditor
            socialFacebookPageUrl={socialFacebookPageUrl}
            socialInstagramProfileUrl={socialInstagramProfileUrl}
            isSaving={isSaving}
            onChangeSocialFacebookPageUrl={setSocialFacebookPageUrl}
            onChangeSocialInstagramProfileUrl={setSocialInstagramProfileUrl}
          />

          <AboutUsContentEditor
            whoDescription={whoDescription}
            locationDescription={locationDescription}
            locationMapEmbedUrl={locationMapEmbedUrl}
            bankAccountDetails={bankAccountDetails}
            contact1Name={contact1Name}
            contact1Phone={contact1Phone}
            contact1Email={contact1Email}
            contact2Name={contact2Name}
            contact2Phone={contact2Phone}
            contact2Email={contact2Email}
            companyHrEmail={companyHrEmail}
            isSaving={isSaving}
            onWhoDescriptionChange={setWhoDescription}
            onLocationDescriptionChange={setLocationDescription}
            onLocationMapEmbedUrlChange={setLocationMapEmbedUrl}
            onBankAccountDetailsChange={setBankAccountDetails}
            onContact1NameChange={setContact1Name}
            onContact1PhoneChange={setContact1Phone}
            onContact1EmailChange={setContact1Email}
            onContact2NameChange={setContact2Name}
            onContact2PhoneChange={setContact2Phone}
            onContact2EmailChange={setContact2Email}
            onCompanyHrEmailChange={setCompanyHrEmail}
          />

          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-card border border-black/10 bg-white/95 p-4 shadow-card backdrop-blur-sm">
            <p className="text-sm text-ink-muted">
              Saves site images, About Us text, and social profile links.
            </p>
            <button type="submit" disabled={isSaving} className="sk-button-primary min-w-[200px]">
              {isSaving ? "Saving…" : "Save site content"}
            </button>
          </div>
        </form>

        <div id="homepage-cms" className="scroll-mt-24">
          <HomepageCmsEditors
            isSaving={isSaving}
            setIsSaving={setIsSaving}
            onError={setErrorMessage}
          />
        </div>
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminLandingEditor;
