import {
  validateVideoUrl,
  detectPlatform,
  isValidUrl,
  extractHostname,
} from '../../src/utils/validation';

describe('validateVideoUrl', () => {
  describe('Instagram URLs', () => {
    it('validates Instagram reel URL', () => {
      const result = validateVideoUrl('https://www.instagram.com/reel/ABC123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('instagram');
    });

    it('validates Instagram post URL', () => {
      const result = validateVideoUrl('https://www.instagram.com/p/ABC123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('instagram');
    });

    it('validates short Instagram URL', () => {
      const result = validateVideoUrl('https://instagr.am/reel/ABC123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('instagram');
    });
  });

  describe('TikTok URLs', () => {
    it('validates TikTok video URL', () => {
      const result = validateVideoUrl('https://www.tiktok.com/@user/video/1234567890');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('tiktok');
    });

    it('validates short TikTok URL', () => {
      const result = validateVideoUrl('https://vm.tiktok.com/ABC123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('tiktok');
    });

    it('validates TikTok t-link URL', () => {
      const result = validateVideoUrl('https://www.tiktok.com/t/ABC123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('tiktok');
    });
  });

  describe('YouTube URLs', () => {
    it('validates YouTube watch URL', () => {
      const result = validateVideoUrl('https://www.youtube.com/watch?v=ABC123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('youtube');
    });

    it('validates YouTube shorts URL', () => {
      const result = validateVideoUrl('https://www.youtube.com/shorts/ABC123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('youtube');
    });

    it('validates youtu.be URL', () => {
      const result = validateVideoUrl('https://youtu.be/ABC123');
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('youtube');
    });
  });

  describe('Facebook URLs', () => {
    // FB matches as a catch-all (any path under facebook.com / fb.com /
    // fb.watch, incl. subdomains) so the app sends importType=video and the
    // backend's yt-dlp facebook extractor handles content-type detection.
    it.each([
      'https://www.facebook.com/share/r/18ivG3BELM/',
      'https://www.facebook.com/share/v/abcdef/',
      'https://www.facebook.com/share/p/xyz123/',
      'https://www.facebook.com/reel/1234567890',
      'https://facebook.com/reels/9876543210',
      'https://www.facebook.com/user.name/videos/1234567890',
      'https://www.facebook.com/watch/?v=1234567890',
      'https://www.facebook.com/watch?v=123',
      'https://m.facebook.com/share/r/abc/',
      'https://web.facebook.com/reel/123',
      'https://mbasic.facebook.com/share/r/abc/',
      'https://fb.watch/abc123',
      'https://fb.com/share/r/abc/',
    ])('recognizes Facebook URL: %s', (url) => {
      const result = validateVideoUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe('facebook');
    });
  });

  describe('Invalid URLs', () => {
    it('rejects empty URL', () => {
      const result = validateVideoUrl('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('rejects non-URL string', () => {
      const result = validateVideoUrl('not-a-url');
      expect(result.isValid).toBe(false);
    });

    it('rejects unsupported platform', () => {
      const result = validateVideoUrl('https://example.com/video/123');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Instagram, TikTok, YouTube, or Facebook');
    });
  });
});

describe('detectPlatform', () => {
  it('detects Instagram', () => {
    expect(detectPlatform('https://www.instagram.com/reel/ABC123')).toBe('instagram');
  });

  it('detects TikTok', () => {
    expect(detectPlatform('https://www.tiktok.com/@user/video/123')).toBe('tiktok');
  });

  it('detects YouTube', () => {
    expect(detectPlatform('https://www.youtube.com/watch?v=ABC123')).toBe('youtube');
  });

  it('returns null for unknown platform', () => {
    expect(detectPlatform('https://example.com')).toBeNull();
  });
});

describe('isValidUrl', () => {
  it('returns true for valid HTTP URL', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('returns true for valid HTTPS URL', () => {
    expect(isValidUrl('https://example.com/path?query=1')).toBe(true);
  });

  it('returns false for invalid URL', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidUrl('')).toBe(false);
  });
});

describe('extractHostname', () => {
  it('extracts hostname from URL', () => {
    expect(extractHostname('https://www.example.com/path')).toBe('example.com');
  });

  it('removes www prefix', () => {
    expect(extractHostname('https://www.instagram.com/reel/ABC123')).toBe('instagram.com');
  });

  it('returns input for invalid URL', () => {
    expect(extractHostname('not-a-url')).toBe('not-a-url');
  });
});
