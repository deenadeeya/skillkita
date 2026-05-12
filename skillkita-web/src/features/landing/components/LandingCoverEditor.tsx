import type { ChangeEvent, FormEvent } from "react";

type FeaturedSlot = 1 | 2 | 3;

type Props = {
  coverDescription: string;
  whoDescription: string;
  whoPreviewUrl: string;
  featuredPreview1: string;
  featuredPreview2: string;
  featuredPreview3: string;
  socialFacebookPageUrl: string;
  socialFacebookPostUrls: string;
  socialInstagramProfileUrl: string;
  socialInstagramPostUrls: string;
  isSaving: boolean;
  onChangeCover: (next: string) => void;
  onChangeWhoDescription: (next: string) => void;
  onWhoImageChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onFeaturedImageChange: (slot: FeaturedSlot, event: ChangeEvent<HTMLInputElement>) => void;
  onChangeSocialFacebookPageUrl: (next: string) => void;
  onChangeSocialFacebookPostUrls: (next: string) => void;
  onChangeSocialInstagramProfileUrl: (next: string) => void;
  onChangeSocialInstagramPostUrls: (next: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function LandingCoverEditor({
  coverDescription,
  whoDescription,
  whoPreviewUrl,
  featuredPreview1,
  featuredPreview2,
  featuredPreview3,
  socialFacebookPageUrl,
  socialFacebookPostUrls,
  socialInstagramProfileUrl,
  socialInstagramPostUrls,
  isSaving,
  onChangeCover,
  onChangeWhoDescription,
  onWhoImageChange,
  onFeaturedImageChange,
  onChangeSocialFacebookPageUrl,
  onChangeSocialFacebookPostUrls,
  onChangeSocialInstagramProfileUrl,
  onChangeSocialInstagramPostUrls,
  onSubmit,
}: Props) {
  return (
    <section className="sk-card p-6">
      <h2 className="text-2xl font-bold text-[#7A1F1F]">Cover</h2>
      <form className="mt-5 space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Cover description</span>
          <textarea
            value={coverDescription}
            onChange={(e) => onChangeCover(e.currentTarget.value)}
            rows={3}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            placeholder="Offering HRD-Corp Levy Claimable Training Courses"
            required
          />
        </label>

        <h3 className="pt-2 text-xl font-bold text-[#7A1F1F]">Home — photo collage</h3>
        <p className="text-xs text-black/70">
          Three images shown on the public home page next to &quot;We provide quality training programs&quot;
          (top-left, top-right, then one wide image below).
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Collage — top left</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFeaturedImageChange(1, e)}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              disabled={isSaving}
            />
            <img
              src={featuredPreview1}
              alt="Featured 1 preview"
              className="mt-2 aspect-[4/3] w-full rounded-xl object-cover"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Collage — top right</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onFeaturedImageChange(2, e)}
              className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
              disabled={isSaving}
            />
            <img
              src={featuredPreview2}
              alt="Featured 2 preview"
              className="mt-2 aspect-[4/3] w-full rounded-xl object-cover"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Collage — wide bottom</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFeaturedImageChange(3, e)}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            disabled={isSaving}
          />
          <img
            src={featuredPreview3}
            alt="Featured 3 preview"
            className="mt-2 aspect-[16/7] w-full rounded-xl object-cover"
          />
        </label>

        <h3 className="pt-2 text-xl font-bold text-[#7A1F1F]">Who are we</h3>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Picture</span>
          <input
            type="file"
            accept="image/*"
            onChange={onWhoImageChange}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            disabled={isSaving}
          />
          <img src={whoPreviewUrl} alt="Who are we preview" className="mt-3 w-full rounded-xl object-cover" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Description</span>
          <textarea
            value={whoDescription}
            onChange={(e) => onChangeWhoDescription(e.currentTarget.value)}
            rows={6}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            placeholder="Write a short company introduction..."
            required
          />
        </label>

        <h3 className="pt-2 text-xl font-bold text-[#7A1F1F]">Social feeds (home page)</h3>
        <p className="text-xs text-black/70">
          Optional. Facebook: Page plugin shows a scrollable timeline; add post URLs (one per line) for embedded
          posts. Instagram: paste public post or reel links, one per line (up to six embeds).
        </p>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Facebook page URL</span>
          <input
            type="url"
            value={socialFacebookPageUrl}
            onChange={(e) => onChangeSocialFacebookPageUrl(e.currentTarget.value)}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            placeholder="https://www.facebook.com/yourpage"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Facebook post URLs (embed, one per line)</span>
          <textarea
            value={socialFacebookPostUrls}
            onChange={(e) => onChangeSocialFacebookPostUrls(e.currentTarget.value)}
            rows={4}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 font-mono text-sm"
            placeholder="https://www.facebook.com/yourpage/posts/pfbid… (one URL per line)"
          />
          <p className="mt-2 text-xs leading-relaxed text-black/70">
            If the site shows “This Facebook post is no longer available”: the post must be{" "}
            <strong>public</strong> (not “Friends” or “Only me”). Open the post in a private/incognito window to
            confirm anyone can see it. Copy the URL from the <strong>address bar</strong> after the post opens (avoid
            pasted text with extra words). Short <code className="rounded bg-black/5 px-0.5">facebook.com/share/p/…</code>{" "}
            links sometimes fail to embed; open that link once, then copy the final{" "}
            <code className="rounded bg-black/5 px-0.5">facebook.com/…/posts/…</code> URL from the bar.
          </p>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">Instagram profile URL</span>
          <input
            type="url"
            value={socialInstagramProfileUrl}
            onChange={(e) => onChangeSocialInstagramProfileUrl(e.currentTarget.value)}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2"
            placeholder="https://www.instagram.com/yourprofile/"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-[#7A1F1F]">
            Instagram post or reel URLs (embed, one per line)
          </span>
          <textarea
            value={socialInstagramPostUrls}
            onChange={(e) => onChangeSocialInstagramPostUrls(e.currentTarget.value)}
            rows={5}
            className="w-full rounded-lg border border-[#d8c9c2] bg-white px-3 py-2 font-mono text-sm"
            placeholder="https://www.instagram.com/p/… (one URL per line)"
          />
        </label>

        <div className="pt-2">
          <button type="submit" disabled={isSaving} className="sk-button-primary">
            {isSaving ? "Saving..." : "Save cover"}
          </button>
        </div>
      </form>
    </section>
  );
}

