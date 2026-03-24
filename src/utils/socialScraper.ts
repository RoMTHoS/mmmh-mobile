/**
 * Client-side social media post scraper.
 *
 * Extracts recipe text from social media posts using:
 * 1. oEmbed APIs (TikTok, etc.) — most reliable for JS-heavy pages
 * 2. OG meta tag scraping (Instagram, etc.) — fallback for simpler pages
 */

export interface SocialScrapedData {
  caption: string | null;
  imageUrl: string | null;
  title: string | null;
}

/**
 * URL patterns that identify photo/carousel posts (not videos).
 * Add new patterns here to support additional platforms.
 */
const PHOTO_POST_PATTERNS: RegExp[] = [
  /instagram\.com\/p\/|instagr\.am\/p\//i,
  /tiktok\.com\/@[\w.-]+\/photo\//i,
];

/**
 * Short/redirect URL patterns that need resolution before photo detection.
 */
const SHORT_URL_PATTERNS: RegExp[] = [
  /^https?:\/\/(vm|vt)\.tiktok\.com\//i,
  /^https?:\/\/(www\.)?tiktok\.com\/t\//i,
  /^https?:\/\/instagr\.am\//i,
];

/**
 * oEmbed endpoints for platforms that support it.
 * These return JSON with post caption/title — much more reliable than HTML scraping.
 */
const OEMBED_ENDPOINTS: Array<{ pattern: RegExp; endpoint: string }> = [
  {
    pattern: /tiktok\.com/i,
    endpoint: 'https://www.tiktok.com/oembed?url=',
  },
];

const OG_DESC_RE = /property=["']og:description["']\s+content=["']([\s\S]*?)["']/i;
const OG_DESC_RE_ALT = /content=["']([\s\S]*?)["']\s+property=["']og:description["']/i;
const OG_IMAGE_RE = /property=["']og:image["']\s+content=["']([\s\S]*?)["']/i;
const OG_IMAGE_RE_ALT = /content=["']([\s\S]*?)["']\s+property=["']og:image["']/i;
const OG_TITLE_RE = /property=["']og:title["']\s+content=["']([\s\S]*?)["']/i;
const OG_TITLE_RE_ALT = /content=["']([\s\S]*?)["']\s+property=["']og:title["']/i;

function extractOgTag(html: string, primary: RegExp, alt: RegExp): string | null {
  const match = primary.exec(html) || alt.exec(html);
  if (!match) return null;
  return match[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Check if a URL has oEmbed support (can extract caption without scraping).
 */
export function hasOembedSupport(url: string): boolean {
  return OEMBED_ENDPOINTS.some((e) => e.pattern.test(url));
}

/**
 * Check if a URL points to a photo/carousel post (not a video).
 */
export function isPhotoPostUrl(url: string): boolean {
  return PHOTO_POST_PATTERNS.some((pattern) => pattern.test(url));
}

function isShortUrl(url: string): boolean {
  return SHORT_URL_PATTERNS.some((pattern) => pattern.test(url));
}

async function resolveShortUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
          'Version/17.0 Mobile/15E148 Safari/604.1',
      },
      redirect: 'follow',
    });
    return response.url || url;
  } catch {
    return url;
  }
}

/**
 * Check if a URL is a photo/carousel post, resolving short URLs if needed.
 */
export async function detectPhotoPost(
  url: string
): Promise<{ isPhoto: boolean; resolvedUrl: string }> {
  if (isPhotoPostUrl(url)) {
    return { isPhoto: true, resolvedUrl: url };
  }

  if (isShortUrl(url)) {
    const resolved = await resolveShortUrl(url);
    if (isPhotoPostUrl(resolved)) {
      return { isPhoto: true, resolvedUrl: resolved };
    }
  }

  return { isPhoto: false, resolvedUrl: url };
}

/**
 * Normalize a social media URL for oEmbed:
 * - Resolve short URLs (vm.tiktok.com → tiktok.com/@user/...)
 * - TikTok oEmbed only supports /video/ URLs, so rewrite /photo/ → /video/
 * - Strip tracking query params that cause 400 errors
 */
async function normalizeForOembed(url: string): Promise<string> {
  let resolved = url;

  // Resolve short URLs first
  if (isShortUrl(url)) {
    resolved = await resolveShortUrl(url);
  }

  // TikTok oEmbed doesn't support /photo/ URLs — use /video/ (same content ID)
  if (/tiktok\.com/i.test(resolved)) {
    resolved = resolved.replace('/photo/', '/video/');
    // Strip tracking params that cause 400 errors
    try {
      const u = new URL(resolved);
      u.search = '';
      resolved = u.toString();
    } catch {
      // keep as-is
    }
  }

  return resolved;
}

/**
 * Try to fetch post metadata via oEmbed API (returns JSON with title/caption).
 * Much more reliable than HTML scraping for JS-heavy platforms like TikTok.
 */
async function tryOembed(url: string): Promise<SocialScrapedData | null> {
  const match = OEMBED_ENDPOINTS.find((e) => e.pattern.test(url));
  if (!match) return null;

  try {
    const normalizedUrl = await normalizeForOembed(url);

    const response = await fetch(`${match.endpoint}${encodeURIComponent(normalizedUrl)}`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      caption: data.title || null,
      imageUrl: data.thumbnail_url || null,
      title: data.author_name || null,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch OG meta tags from the page HTML (works well for Instagram, simple sites).
 */
async function tryOgScrape(url: string): Promise<SocialScrapedData> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
          'AppleWebKit/605.1.15 (KHTML, like Gecko) ' +
          'Version/17.0 Mobile/15E148 Safari/604.1',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return { caption: null, imageUrl: null, title: null };
    }

    const html = await response.text();

    if (html.includes('/accounts/login') || html.includes('/challenge/')) {
      return { caption: null, imageUrl: null, title: null };
    }

    const caption = extractOgTag(html, OG_DESC_RE, OG_DESC_RE_ALT);
    const imageUrl = extractOgTag(html, OG_IMAGE_RE, OG_IMAGE_RE_ALT);
    const title = extractOgTag(html, OG_TITLE_RE, OG_TITLE_RE_ALT);

    return { caption, imageUrl, title };
  } catch {
    return { caption: null, imageUrl: null, title: null };
  }
}

/**
 * Extract post metadata using the best available method:
 * 1. oEmbed API (if platform supports it)
 * 2. OG meta tag scraping (only for non-oEmbed platforms like Instagram)
 *
 * OG scraping is NOT used for oEmbed platforms (TikTok etc.) because their
 * OG tags contain GDPR/cookie consent text instead of post content.
 */
export async function scrapeSocialPost(url: string): Promise<SocialScrapedData> {
  // Try oEmbed first (most reliable for TikTok, etc.)
  const oembedResult = await tryOembed(url);
  if (oembedResult?.caption) {
    return oembedResult;
  }

  // For oEmbed-supported platforms, don't fall back to OG scraping —
  // their OG tags return GDPR junk, not post content.
  if (hasOembedSupport(url)) {
    return { caption: null, imageUrl: null, title: null };
  }

  // OG scraping fallback only for platforms without oEmbed (Instagram, etc.)
  return tryOgScrape(url);
}
