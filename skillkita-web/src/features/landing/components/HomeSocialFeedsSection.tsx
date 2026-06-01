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
/** Compact page timeline; post embeds use larger height so full posts are not clipped. */
const FB_PAGE_PLUGIN_HEIGHT = 400;
const FB_PAGE_PLUGIN_WIDTH = 360;
/** Embedded Post iframes need generous height — Facebook does not auto-resize the parent iframe. */
const FB_POST_EMBED_WIDTH = 500;
const FB_POST_EMBED_HEIGHT = 1100;

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
      className="mt-10 w-full max-w-4xl text-left md:mt-14"
      aria-labelledby={`${embedId}-social-heading`}
    >
      <h2 id={`${embedId}-social-heading`} className="text-center text-xl font-bold text-ink md:text-2xl">
        Follow us online
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-center text-xs text-ink-muted md:text-sm">
        We are on Instagram and Facebook. Follow us to stay updated with our latest news and events.
      </p>

      <div className="mx-auto mt-6 flex w-full max-w-lg flex-col gap-5 md:max-w-2xl">
        {(fbPageIframeSrc || fbPostHrefs.length > 0) && (
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 md:p-4">
            <h3 className="text-base font-bold text-primary md:text-lg">Facebook</h3>

            {fbPageIframeSrc && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold text-ink-muted">Page timeline</p>
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
                <p className="mt-2 text-center text-xs text-ink-muted">
                  <a
                    href={fbPageHref ?? "#"}
                    className="font-semibold text-primary underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open page on Facebook
                  </a>
                </p>
              </div>
            )}

            {fbPostHrefs.length > 0 && (
              <div className={fbPageIframeSrc ? "mt-5 border-t border-black/10 pt-5" : "mt-3"}>
                <p className="mb-2 text-xs font-semibold text-ink-muted">Selected posts</p>
                <div className="-mx-1 flex flex-col items-center gap-4 overflow-x-auto px-1 sm:mx-0 sm:px-0">
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
          <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 md:p-4">
            <h3 className="text-base font-bold text-primary md:text-lg">Instagram</h3>

            {igPostHrefs.length > 0 ? (
              <div ref={igContainerRef} className="mt-3 flex flex-col items-center gap-5">
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
                      maxWidth: "min(100%, 400px)",
                      minWidth: "240px",
                      padding: 0,
                      width: "calc(100% - 2px)",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#515bd4] p-[2px]">
                <div className="rounded-[12px] bg-white px-4 py-6 text-center md:px-5 md:py-8">
                  <p className="text-sm font-semibold text-ink-muted">See photos and reels on our profile.</p>
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
              <p className="mt-4 text-center text-xs text-ink-muted">
                <a href={igProfile} className="font-semibold text-primary underline" target="_blank" rel="noreferrer">
                  Open full profile on Instagram
                </a>
              </p>
            )}
            {!igPostHrefs.length && igProfile && (
              <p className="mt-3 text-center text-xs text-ink-muted">
                Add one Instagram post or reel URL per line in Manage Home to embed highlights here.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
