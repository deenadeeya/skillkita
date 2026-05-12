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
  uploadSiteAssetHomeFeatured,
  uploadSiteAssetWhoImage,
} from "../../features/landing/api/landingStorage";
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

  const saveLanding = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      const whoUrl = await uploadWhoImageIfNeeded();
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
        updated_at: new Date().toISOString(),
      };

      await upsertLandingContent(payload);

      setWhoFile(null);
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
        subtitle="Update cover text, who we are, home photos, and optional Facebook / Instagram links for the bottom of the home page. Company experiences are edited on the Company Experience page."
        errorMessage={errorMessage}
        isAuthChecking={viewerState.kind === "loading"}
        isAuthorized={viewerState.kind === "signedIn"}
        actions={
          <a href="/" className="sk-button-secondary w-fit">
            View site
          </a>
        }
      >
        <div className="max-w-3xl">
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
            onSubmit={saveLanding}
          />
        </div>
      </AdminPageFrame>
    </DashboardLayout>
  );
};

export default AdminLandingEditor;
