import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import PlaceholderPoster from "../../assets/placeholder.jpg";
import DashboardLayout from "../../app/layout/DashboardLayout";
import { adminNavItems } from "../../app/layout/navItems";
import { supabase } from "../../shared/api/supabaseClient";
import { AdminPageFrame } from "../../shared/ui/AdminPageFrame";
import { useViewer } from "../../shared/hooks/useViewer";
import { getLandingContent, upsertLandingContent, type LandingContentRow } from "../../features/landing/api/landingApi";
import {
  uploadSiteAssetBankQr,
  uploadSiteAssetHomeFeatured,
  uploadSiteAssetWhoImage,
} from "../../features/landing/api/landingStorage";
import { AboutUsContentEditor } from "../../features/landing/components/AboutUsContentEditor";
import { LandingCoverEditor } from "../../features/landing/components/LandingCoverEditor";

const AdminLandingEditor = () => {
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const viewerState = useViewer();

  const [landing, setLanding] = useState<LandingContentRow | null>(null);
  const [coverDescription, setCoverDescription] = useState("");
  const [whoDescription, setWhoDescription] = useState("");
  const [whoPreviewUrl, setWhoPreviewUrl] = useState<string>(PlaceholderPoster);
  const [whoFile, setWhoFile] = useState<File | null>(null);

  const [featured1Preview, setFeatured1Preview] = useState<string>(PlaceholderPoster);
  const [featured2Preview, setFeatured2Preview] = useState<string>(PlaceholderPoster);
  const [featured3Preview, setFeatured3Preview] = useState<string>(PlaceholderPoster);
  const [featured1File, setFeatured1File] = useState<File | null>(null);
  const [featured2File, setFeatured2File] = useState<File | null>(null);
  const [featured3File, setFeatured3File] = useState<File | null>(null);

  const [socialFacebookPageUrl, setSocialFacebookPageUrl] = useState("");
  const [socialFacebookPostUrls, setSocialFacebookPostUrls] = useState("");
  const [socialInstagramProfileUrl, setSocialInstagramProfileUrl] = useState("");
  const [socialInstagramPostUrls, setSocialInstagramPostUrls] = useState("");

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
    const row = await getLandingContent(1);
    if (!row) {
      setLanding(null);
      setCoverDescription("");
      setWhoDescription("");
      setWhoPreviewUrl(PlaceholderPoster);
      setFeatured1Preview(PlaceholderPoster);
      setFeatured2Preview(PlaceholderPoster);
      setFeatured3Preview(PlaceholderPoster);
      setFeatured1File(null);
      setFeatured2File(null);
      setFeatured3File(null);
      setSocialFacebookPageUrl("");
      setSocialFacebookPostUrls("");
      setSocialInstagramProfileUrl("");
      setSocialInstagramPostUrls("");
      setLocationDescription("");
      setLocationMapEmbedUrl("");
      setBankAccountDetails("");
      setBankQrPreviewUrl(PlaceholderPoster);
      setBankQrFile(null);
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
    setCoverDescription(row.cover_description ?? "");
    setWhoDescription(row.who_description ?? "");
    setWhoPreviewUrl(row.who_image_url ?? PlaceholderPoster);
    setFeatured1Preview(row.home_featured_1_url ?? PlaceholderPoster);
    setFeatured2Preview(row.home_featured_2_url ?? PlaceholderPoster);
    setFeatured3Preview(row.home_featured_3_url ?? PlaceholderPoster);
    setFeatured1File(null);
    setFeatured2File(null);
    setFeatured3File(null);
    setSocialFacebookPageUrl(row.social_facebook_page_url ?? "");
    setSocialFacebookPostUrls(row.social_facebook_post_urls ?? "");
    setSocialInstagramProfileUrl(row.social_instagram_profile_url ?? "");
    setSocialInstagramPostUrls(row.social_instagram_post_url ?? "");
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

  const onFeaturedImageChange = (slot: 1 | 2 | 3, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0] ?? null;
    const fallback1 = landing?.home_featured_1_url ?? PlaceholderPoster;
    const fallback2 = landing?.home_featured_2_url ?? PlaceholderPoster;
    const fallback3 = landing?.home_featured_3_url ?? PlaceholderPoster;

    if (slot === 1) {
      if (!file) {
        setFeatured1File(null);
        setFeatured1Preview(fallback1);
        return;
      }
      setFeatured1File(file);
      setFeatured1Preview(URL.createObjectURL(file));
    } else if (slot === 2) {
      if (!file) {
        setFeatured2File(null);
        setFeatured2Preview(fallback2);
        return;
      }
      setFeatured2File(file);
      setFeatured2Preview(URL.createObjectURL(file));
    } else {
      if (!file) {
        setFeatured3File(null);
        setFeatured3Preview(fallback3);
        return;
      }
      setFeatured3File(file);
      setFeatured3Preview(URL.createObjectURL(file));
    }
  };

  const uploadFeaturedIfNeeded = async () => {
    const u1 = featured1File ? await uploadSiteAssetHomeFeatured(featured1File, 1) : null;
    const u2 = featured2File ? await uploadSiteAssetHomeFeatured(featured2File, 2) : null;
    const u3 = featured3File ? await uploadSiteAssetHomeFeatured(featured3File, 3) : null;
    return { u1, u2, u3 };
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

  const uploadWhoImageIfNeeded = async (): Promise<string | null> => {
    if (!whoFile) return null;
    return await uploadSiteAssetWhoImage(whoFile);
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

  const uploadBankQrIfNeeded = async (): Promise<string | null> => {
    if (!bankQrFile) return null;
    return await uploadSiteAssetBankQr(bankQrFile);
  };

  const saveLanding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const whoUrl = await uploadWhoImageIfNeeded();
      const bankQrUrl = await uploadBankQrIfNeeded();
      const { u1, u2, u3 } = await uploadFeaturedIfNeeded();

      const payload = {
        id: 1,
        cover_description: coverDescription.trim(),
        who_description: whoDescription.trim(),
        who_image_url: whoUrl ?? landing?.who_image_url ?? null,
        home_featured_1_url: u1 ?? landing?.home_featured_1_url ?? null,
        home_featured_2_url: u2 ?? landing?.home_featured_2_url ?? null,
        home_featured_3_url: u3 ?? landing?.home_featured_3_url ?? null,
        social_facebook_page_url: socialFacebookPageUrl.trim() || null,
        social_facebook_post_urls: socialFacebookPostUrls.trim() || null,
        social_instagram_profile_url: socialInstagramProfileUrl.trim() || null,
        social_instagram_post_url: socialInstagramPostUrls.trim() || null,
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

      setWhoFile(null);
      setBankQrFile(null);
      setFeatured1File(null);
      setFeatured2File(null);
      setFeatured3File(null);
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
      onLogout={async () => {
        await supabase.auth.signOut();
        window.localStorage.removeItem("skillkita-role");
        window.location.href = "/";
      }}
    >
      <AdminPageFrame
        title="Manage Landing Page"
        subtitle="Update the home page, About Us sections (profile, location, bank, contacts), and social feeds. Company experiences are edited on the Company Experience page."
        errorMessage={errorMessage}
        isAuthChecking={viewerState.kind === "loading"}
        isAuthorized={viewerState.kind === "signedIn"}
        actions={
          <a href="/" className="sk-button-secondary w-fit">
            View site
          </a>
        }
      >
        <form className="max-w-3xl" onSubmit={saveLanding}>
          <LandingCoverEditor
            coverDescription={coverDescription}
            whoDescription={whoDescription}
            whoPreviewUrl={whoPreviewUrl}
            featuredPreview1={featured1Preview}
            featuredPreview2={featured2Preview}
            featuredPreview3={featured3Preview}
            isSaving={isSaving}
            socialFacebookPageUrl={socialFacebookPageUrl}
            socialFacebookPostUrls={socialFacebookPostUrls}
            socialInstagramProfileUrl={socialInstagramProfileUrl}
            socialInstagramPostUrls={socialInstagramPostUrls}
            onChangeCover={setCoverDescription}
            onChangeWhoDescription={setWhoDescription}
            onWhoImageChange={onWhoImageChange}
            onFeaturedImageChange={onFeaturedImageChange}
            onChangeSocialFacebookPageUrl={setSocialFacebookPageUrl}
            onChangeSocialFacebookPostUrls={setSocialFacebookPostUrls}
            onChangeSocialInstagramProfileUrl={setSocialInstagramProfileUrl}
            onChangeSocialInstagramPostUrls={setSocialInstagramPostUrls}
          />
          <AboutUsContentEditor
            whoPreviewUrl={whoPreviewUrl}
            whoDescription={whoDescription}
            locationDescription={locationDescription}
            locationMapEmbedUrl={locationMapEmbedUrl}
            bankAccountDetails={bankAccountDetails}
            bankQrPreviewUrl={bankQrPreviewUrl}
            contact1Name={contact1Name}
            contact1Phone={contact1Phone}
            contact1Email={contact1Email}
            contact2Name={contact2Name}
            contact2Phone={contact2Phone}
            contact2Email={contact2Email}
            companyHrEmail={companyHrEmail}
            isSaving={isSaving}
            onWhoImageChange={onWhoImageChange}
            onWhoDescriptionChange={setWhoDescription}
            onLocationDescriptionChange={setLocationDescription}
            onLocationMapEmbedUrlChange={setLocationMapEmbedUrl}
            onBankAccountDetailsChange={setBankAccountDetails}
            onBankQrImageChange={onBankQrImageChange}
            onContact1NameChange={setContact1Name}
            onContact1PhoneChange={setContact1Phone}
            onContact1EmailChange={setContact1Email}
            onContact2NameChange={setContact2Name}
            onContact2PhoneChange={setContact2Phone}
            onContact2EmailChange={setContact2Email}
            onCompanyHrEmailChange={setCompanyHrEmail}
          />
          <div className="mt-6">
            <button type="submit" disabled={isSaving} className="sk-button-primary">
              {isSaving ? "Saving..." : "Save home & About Us"}
            </button>
          </div>
        </form>
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminLandingEditor;
