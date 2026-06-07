import {
  AdminLandingTabLink,
  type AdminLandingTabId,
} from "./admin/AdminLandingSectionNav";

type Props = {
  socialFacebookPageUrl: string;
  socialInstagramProfileUrl: string;
  socialLinkedinProfileUrl: string;
  isSaving: boolean;
  onNavigateToTab: (tab: AdminLandingTabId) => void;
  onChangeSocialFacebookPageUrl: (next: string) => void;
  onChangeSocialInstagramProfileUrl: (next: string) => void;
  onChangeSocialLinkedinProfileUrl: (next: string) => void;
};

export function LandingContentEditor({
  socialFacebookPageUrl,
  socialInstagramProfileUrl,
  socialLinkedinProfileUrl,
  isSaving,
  onNavigateToTab,
  onChangeSocialFacebookPageUrl,
  onChangeSocialInstagramProfileUrl,
  onChangeSocialLinkedinProfileUrl,
}: Props) {
  return (
    <section className="sk-card p-6 md:p-8">
      <div className="border-b border-black/5 pb-5">
        <h2 className="sk-section-title">Home page — social profiles</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Facebook, Instagram, and LinkedIn profile links shown in the site footer. Hero description
          and buttons are fixed on the public site. Images are in{" "}
          <AdminLandingTabLink tab="site-images" onNavigate={onNavigateToTab} />.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="sk-label">Facebook page URL</span>
          <input
            type="url"
            value={socialFacebookPageUrl}
            onChange={(e) => onChangeSocialFacebookPageUrl(e.currentTarget.value)}
            className="sk-input"
            placeholder="https://www.facebook.com/yourpage"
            disabled={isSaving}
          />
        </label>

        <label className="block">
          <span className="sk-label">Instagram profile URL</span>
          <input
            type="url"
            value={socialInstagramProfileUrl}
            onChange={(e) => onChangeSocialInstagramProfileUrl(e.currentTarget.value)}
            className="sk-input"
            placeholder="https://www.instagram.com/yourprofile/"
            disabled={isSaving}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="sk-label">LinkedIn profile URL</span>
          <input
            type="url"
            value={socialLinkedinProfileUrl}
            onChange={(e) => onChangeSocialLinkedinProfileUrl(e.currentTarget.value)}
            className="sk-input"
            placeholder="https://www.linkedin.com/company/yourpage/"
            disabled={isSaving}
          />
        </label>
      </div>
    </section>
  );
}
