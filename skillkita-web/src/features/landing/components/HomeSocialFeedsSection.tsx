import { useEffect, useId, useMemo, useRef } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

export type HomeSocialFeedsProps = {
  facebookPageUrl: string | null;
  /** One Facebook post URL per line (Embedded Post iframes). */
  facebookPostUrls: string | null;
  instagramProfileUrl: string | null;
  /** One Instagram post/reel URL per line (official embeds). */
  instagramPostUrls: string | null;
};

const MAX_EMBEDS = 6;
const FB_PAGE_PLUGIN_HEIGHT = 600;
const FB_PAGE_PLUGIN_WIDTH = 500;
const FB_POST_EMBED_WIDTH = 500;
const FB_POST_EMBED_HEIGHT = 680;

function trimUrl(url: string | null | undefined): string | null {
  const t = url?.trim();
  return t ? t : null;
}

function withHttps(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

function splitUrlList(raw: string | null | undefined, max: number): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

function normalizeFacebookPageHref(url: string): string | null {
  const u = trimUrl(url);
  if (!u) return null;
  const href = withHttps(u);
  if (!/facebook\.com\//i.test(href)) return null;
  return href;
}

function sanitizeFacebookPostUrlForEmbed(href: string): string {
  try {
    const u = new URL(href);
    const host = u.hostname.toLowerCase();
    if (!host.endsWith("facebook.com")) return href;

    if (host === "m.facebook.com" || host === "mbasic.facebook.com" || host === "l.facebook.com") {
      u.hostname = "www.facebook.com";
    } else if (host === "facebook.com") {
      u.hostname = "www.facebook.com";
    }

    const stripParamPrefixes = ["__cft__"];
    for (const key of [...u.searchParams.keys()]) {
      if (stripParamPrefixes.some((p) => key.startsWith(p))) {
        u.searchParams.delete(key);
      }
    }
    for (const k of ["fbclid", "__tn__", "ref", "_rdc", "_rdr", "mibextid", "eid"]) {
      u.searchParams.delete(k);
    }

    return u.toString();
  } catch {
    return href;
  }
}

function normalizeFacebookPostEmbedUrl(url: string): string | null {
  const u = trimUrl(url);
  if (!u) return null;
  const href = withHttps(u);
  if (!/facebook\.com\//i.test(href)) return null;
  const lower = href.toLowerCase();
  const looksLikePost =
    /\/posts\//.test(lower) ||
    /permalink\.php/.test(lower) ||
    /\/videos\//.test(lower) ||
    /\/reel\//.test(lower) ||
    /pfbid/.test(lower) ||
    /\/share\//.test(lower) ||
    /story_fbid=/.test(lower) ||
    /\/groups\/.+\/permalink\//.test(lower) ||
    /\/photo\.php/.test(lower) ||
    /\/story\.php/.test(lower);
  if (!looksLikePost) return null;
  return sanitizeFacebookPostUrlForEmbed(href);
}

function normalizeInstagramProfileHref(url: string): string | null {
  const u = trimUrl(url);
  if (!u) return null;
  const href = withHttps(u);
  if (!/instagram\.com\//i.test(href)) return null;
  return href;
}

function normalizeInstagramPostPermalink(url: string): string | null {
  const u = trimUrl(url);
  if (!u) return null;
  let href = withHttps(u);
  if (!/instagram\.com\/(p|reel|tv)\//i.test(href)) return null;
  if (!href.endsWith("/")) href = `${href}/`;
  return href;
}

export function HomeSocialFeedsSection({
  facebookPageUrl,
  facebookPostUrls,
  instagramProfileUrl,
  instagramPostUrls,
}: HomeSocialFeedsProps) {
  const fbPageHref = useMemo(() => normalizeFacebookPageHref(facebookPageUrl ?? ""), [facebookPageUrl]);
  const fbPostHrefs = useMemo(
    () => splitUrlList(facebookPostUrls ?? undefined, MAX_EMBEDS).map(normalizeFacebookPostEmbedUrl).filter(Boolean) as string[],
    [facebookPostUrls]
  );
  const igProfile = useMemo(
    () => normalizeInstagramProfileHref(instagramProfileUrl ?? ""),
    [instagramProfileUrl]
  );
  const igPostHrefs = useMemo(
    () =>
      splitUrlList(instagramPostUrls ?? undefined, MAX_EMBEDS)
        .map(normalizeInstagramPostPermalink)
        .filter(Boolean) as string[],
    [instagramPostUrls]
  );

  const embedId = useId();
  const igContainerRef = useRef<HTMLDivElement | null>(null);
  const igPostsKey = igPostHrefs.join("|");

  const showSection = Boolean(fbPageHref || fbPostHrefs.length || igProfile || igPostHrefs.length);

  useEffect(() => {
    if (!igPostHrefs.length || !igContainerRef.current) return;

    const process = () => {
      window.instgrm?.Embeds.process();
    };

    const existing = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
    if (existing) {
      process();
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.instagram.com/embed.js";
    script.onload = process;
    document.body.appendChild(script);
  }, [igPostsKey, igPostHrefs.length]);

  if (!showSection) return null;

  const fbPageIframeSrc = fbPageHref
    ? `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(fbPageHref)}&tabs=timeline&width=${FB_PAGE_PLUGIN_WIDTH}&height=${FB_PAGE_PLUGIN_HEIGHT}&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true`
    : null;

  return (
    <section
      className="mt-14 w-full max-w-6xl text-left md:mt-20"
      aria-labelledby={`${embedId}-social-heading`}
    >
      <h2 id={`${embedId}-social-heading`} className="text-center text-2xl font-bold text-[#0001fc] md:text-3xl">
        Follow us online
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-black/75">
        Embedded posts from Facebook and Instagram (configure URLs in Manage Home). Your Facebook Page plugin can
        also show a scrollable timeline of recent posts.
      </p>

      <div className="mx-auto mt-8 flex w-full max-w-xl flex-col gap-8 md:max-w-2xl">
        {(fbPageIframeSrc || fbPostHrefs.length > 0) && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5">
            <h3 className="text-lg font-bold text-[#7A1F1F]">Facebook</h3>

            {fbPageIframeSrc && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold text-black/60">Page timeline</p>
                <div className="flex justify-center overflow-x-auto">
                  <iframe
                    title="Facebook page"
                    src={fbPageIframeSrc}
                    width={FB_PAGE_PLUGIN_WIDTH}
                    height={FB_PAGE_PLUGIN_HEIGHT}
                    className="max-w-full border-0"
                    scrolling="no"
                    frameBorder={0}
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <p className="mt-2 text-center text-xs text-black/60">
                  <a
                    href={fbPageHref ?? "#"}
                    className="font-semibold text-[#7A1F1F] underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open page on Facebook
                  </a>
                </p>
              </div>
            )}

            {fbPostHrefs.length > 0 && (
              <div className={fbPageIframeSrc ? "mt-8 border-t border-[#efe1db] pt-8" : "mt-3"}>
                <p className="mb-3 text-xs font-semibold text-black/60">Selected posts</p>
                <div className="flex flex-col items-center gap-6">
                  {fbPostHrefs.map((href, i) => (
                    <iframe
                      key={href}
                      title={`Facebook post ${i + 1}`}
                      src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(href)}&show_text=true&width=${FB_POST_EMBED_WIDTH}&height=${FB_POST_EMBED_HEIGHT}&locale=en_US`}
                      width={FB_POST_EMBED_WIDTH}
                      height={FB_POST_EMBED_HEIGHT}
                      className="max-w-full border-0"
                      scrolling="no"
                      frameBorder={0}
                      allowFullScreen
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(igPostHrefs.length > 0 || igProfile) && (
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5">
            <h3 className="text-lg font-bold text-[#7A1F1F]">Instagram</h3>

            {igPostHrefs.length > 0 ? (
              <div ref={igContainerRef} className="mt-3 flex flex-col items-center gap-8">
                {igPostHrefs.map((permalink) => (
                  <blockquote
                    key={permalink}
                    className="instagram-media"
                    data-instgrm-permalink={permalink}
                    data-instgrm-version="14"
                    style={{
                      background: "#FFF",
                      border: 0,
                      borderRadius: "12px",
                      margin: "1px",
                      maxWidth: "540px",
                      minWidth: "240px",
                      padding: 0,
                      width: "calc(100% - 2px)",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#515bd4] p-[2px]">
                <div className="rounded-[14px] bg-white px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-black/80">See photos and reels on our profile.</p>
                  <a
                    href={igProfile!}
                    className="sk-button-primary mt-5 inline-block rounded-xl px-6 py-3"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Instagram profile
                  </a>
                </div>
              </div>
            )}

            {igPostHrefs.length > 0 && igProfile && (
              <p className="mt-4 text-center text-xs text-black/60">
                <a href={igProfile} className="font-semibold text-[#7A1F1F] underline" target="_blank" rel="noreferrer">
                  Open full profile on Instagram
                </a>
              </p>
            )}
            {!igPostHrefs.length && igProfile && (
              <p className="mt-3 text-center text-xs text-black/60">
                Add one Instagram post or reel URL per line in Manage Home to embed highlights here.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
