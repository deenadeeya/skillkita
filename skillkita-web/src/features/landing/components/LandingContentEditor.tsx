type Props = {
  socialFacebookPageUrl: string;
  socialInstagramProfileUrl: string;
  isSaving: boolean;
  onChangeSocialFacebookPageUrl: (next: string) => void;
  onChangeSocialInstagramProfileUrl: (next: string) => void;
};

export function LandingContentEditor({
  socialFacebookPageUrl,
  socialInstagramProfileUrl,
  isSaving,
  onChangeSocialFacebookPageUrl,
  onChangeSocialInstagramProfileUrl,
}: Props) {
  return (
    <section id="home-content" className="sk-card scroll-mt-24 p-6 md:p-8">
      <div className="border-b border-black/5 pb-5">
        <h2 className="sk-section-title">Home page — social profiles</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Facebook and Instagram profile links only. Hero description and buttons are fixed on the
          public site. Images are in{" "}
          <a href="#site-media" className="font-semibold text-primary underline">
            Site images
          </a>
          .
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
      </div>
    </section>
  );
}
