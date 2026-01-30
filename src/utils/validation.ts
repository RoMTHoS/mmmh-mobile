/**
 * URL validation utilities for import flow
 */

export type Platform = 'instagram' | 'tiktok' | 'youtube';

interface VideoUrlValidation {
  isValid: boolean;
  platform?: Platform;
  error?: string;
}

const VIDEO_URL_PATTERNS: Record<Platform, RegExp[]> = {
  instagram: [
    /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\/[\w-]+/i,
    /^https?:\/\/(www\.)?instagr\.am\/(p|reel)\/[\w-]+/i,
  ],
  tiktok: [
    /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
    /^https?:\/\/(vm|vt)\.tiktok\.com\/[\w-]+/i,
    /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w-]+/i,
  ],
  youtube: [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]+/i,
    /^https?:\/\/youtu\.be\/[\w-]+/i,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/i,
  ],
};

export function validateVideoUrl(url: string): VideoUrlValidation {
  if (!url || url.trim().length === 0) {
    return { isValid: false, error: 'URL is required' };
  }

  const trimmedUrl = url.trim();

  // Check if it's a valid URL format
  try {
    new URL(trimmedUrl);
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }

  // Check against known video platforms
  for (const [platform, patterns] of Object.entries(VIDEO_URL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(trimmedUrl)) {
        return { isValid: true, platform: platform as Platform };
      }
    }
  }

  return {
    isValid: false,
    error: 'URL must be from Instagram, TikTok, or YouTube',
  };
}

export function detectPlatform(url: string): Platform | null {
  const validation = validateVideoUrl(url);
  return validation.platform || null;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
