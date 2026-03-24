/**
 * Client-side Instagram post scraper.
 *
 * When the server can't access Instagram (rate-limited),
 * the mobile app fetches the page using the user's own IP
 * and extracts og:description (caption) + og:image (thumbnail).
 */

export interface InstagramScrapedData {
  caption: string | null;
  imageUrl: string | null;
  title: string | null;
}

const OG_DESC_RE = /property=["']og:description["']\s+content=["']([\s\S]*?)["']/i;
const OG_DESC_RE_ALT = /content=["']([\s\S]*?)["']\s+property=["']og:description["']/i;
const OG_IMAGE_RE = /property=["']og:image["']\s+content=["']([\s\S]*?)["']/i;
const OG_IMAGE_RE_ALT = /content=["']([\s\S]*?)["']\s+property=["']og:image["']/i;
const OG_TITLE_RE = /property=["']og:title["']\s+content=["']([\s\S]*?)["']/i;
const OG_TITLE_RE_ALT = /content=["']([\s\S]*?)["']\s+property=["']og:title["']/i;

function extractOgTag(html: string, primary: RegExp, alt: RegExp): string | null {
  const match = primary.exec(html) || alt.exec(html);
  if (!match) return null;
  // Decode HTML entities
  return match[1]
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Fetch an Instagram post page from the user's device and extract metadata.
 * Uses a mobile Safari User-Agent for best compatibility.
 */
export async function scrapeInstagramPost(url: string): Promise<InstagramScrapedData> {
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

    // Check for login redirect in the HTML
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
 * Check if a URL is an Instagram photo post (/p/ only, not reels).
 */
export function isInstagramPostUrl(url: string): boolean {
  return /instagram\.com\/p\/|instagr\.am\/p\//i.test(url);
}
